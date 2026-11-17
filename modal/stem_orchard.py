"""Private Modal + Cloudflare R2 runner for source-owned Stem Orchard v1.

Owner-triggered only. Never deploys an endpoint, changes HUMKIN radio or serves
private stems. R2 credentials live in a Modal Secret, not in GitHub or requests.
"""
import json
import os
import subprocess
import tempfile
from pathlib import Path

import modal

ROOT = Path(__file__).resolve().parents[1]
app = modal.App("haunted-phonograph-stem-orchard")
image = (
    modal.Image.from_registry("node:22-bookworm-slim", add_python="3.11")
    .apt_install("ffmpeg")
    .pip_install("boto3>=1.35,<2")
    .add_local_file(str(ROOT / "src/provenance.mjs"), "/app/src/provenance.mjs")
    .add_local_file(str(ROOT / "src/stem-orchard.mjs"), "/app/src/stem-orchard.mjs")
    .add_local_file(str(ROOT / "scripts/run-stem-orchard.mjs"), "/app/scripts/run-stem-orchard.mjs")
)


def client():
    import boto3
    from botocore.config import Config

    account_id = os.environ["R2_ACCOUNT_ID"]
    return boto3.client(
        "s3", endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto", config=Config(signature_version="s3v4"),
    )


def validate_key(key):
    if not isinstance(key, str) or not key.startswith("stems/"):
        raise ValueError("Only private stems/ keys may be ingested")
    if "\\" in key or "%" in key or "//" in key or any(
        part in ("", ".", "..") for part in key.split("/")
    ):
        raise ValueError("Unsafe R2 key")
    if not key.lower().endswith((".wav", ".flac", ".mp3", ".m4a")):
        raise ValueError("Unrecognized audio stem extension")
    return key


def _process(request_json: str) -> dict:
    from botocore.exceptions import ClientError

    if len(request_json.encode("utf8")) > 100_000:
        raise ValueError("Request exceeds 100 KB")
    request = json.loads(request_json)
    if request.get("schema") != "haunted-phonograph/stem-orchard-request/v1":
        raise ValueError("Unsupported request schema")
    layers = request.get("layers")
    if not isinstance(layers, list) or not 2 <= len(layers) <= 8:
        raise ValueError("Expected two to eight layers")
    keys = [validate_key(layer.get("objectKey")) for layer in layers]
    bucket = os.environ["R2_BUCKET"]
    s3 = client()
    with tempfile.TemporaryDirectory() as tmp:
        workspace = Path(tmp)
        source_root = workspace / "source"
        for key in sorted(set(keys)):
            details = s3.head_object(Bucket=bucket, Key=key)
            if details["ContentLength"] > 500 * 1024 * 1024:
                raise ValueError("Stem exceeds 500 MiB")
            path = source_root.joinpath(*key.split("/"))
            path.parent.mkdir(parents=True, exist_ok=True)
            s3.download_file(bucket, key, str(path))
        request_path = workspace / "request.json"
        request_path.write_text(request_json, encoding="utf8")
        output_stem = workspace / "candidate"
        subprocess.run(
            ["node", "/app/scripts/run-stem-orchard.mjs",
             str(request_path), str(source_root), str(output_stem)],
            check=True, timeout=2200,
        )
        handoff_path = workspace / "candidate.humkin.json"
        receipt_path = workspace / "candidate.receipt.json"
        audio_path = workspace / "candidate.wav"
        handoff = json.loads(handoff_path.read_text(encoding="utf8"))
        if (handoff["editorialStatus"] != "HOLD" or
                handoff["broadcastingAuthorized"] is not False):
            raise ValueError("Non-HOLD candidate refused")
        candidate_id = handoff["candidateId"]
        prefix = f"candidates/{candidate_id}/"
        keys_to_write = (prefix + "mix.wav", prefix + "receipt.json", prefix + "humkin.json")
        # Do not silently replace prior candidates, including partial prior runs.
        for key in keys_to_write:
            try:
                s3.head_object(Bucket=bucket, Key=key)
                raise ValueError(f"Candidate already exists; refusing overwrite: {key}")
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code", "")
                if code not in ("404", "NoSuchKey", "NotFound"):
                    raise
        handoff["privateR2Key"] = keys_to_write[0]
        handoff_path.write_text(json.dumps(handoff, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf8")
        # Bucket is private. No public domain, ACL, station mutation, or stream.
        s3.upload_file(str(audio_path), bucket, keys_to_write[0],
                       ExtraArgs={"ContentType": "audio/wav"})
        s3.upload_file(str(receipt_path), bucket, keys_to_write[1],
                       ExtraArgs={"ContentType": "application/json"})
        s3.upload_file(str(handoff_path), bucket, keys_to_write[2],
                       ExtraArgs={"ContentType": "application/json"})
        return {
            "candidateId": candidate_id, "status": "PRIVATE_HOLD",
            "r2AudioKey": keys_to_write[0],
            "r2ReceiptKey": keys_to_write[1],
            "r2HandoffKey": keys_to_write[2],
            "outputSha256": handoff["outputSha256"],
            "broadcastingAuthorized": False,
        }


@app.function(
    image=image, secrets=[modal.Secret.from_name("humkin-r2-private")],
    cpu=2, memory=2048, timeout=2400, max_containers=1,
)
def prepare_private_candidate(request_json: str) -> dict:
    return _process(request_json)


@app.function(
    image=image, secrets=[modal.Secret.from_name("humkin-r2-private")],
    cpu=2, memory=2048, timeout=2400, max_containers=1,
)
def prepare_from_r2(request_key: str) -> dict:
    # This route supports phone-only manual GitHub Actions and older Macs.
    if not isinstance(request_key, str) or not request_key.startswith("requests/"):
        raise ValueError("Expected private requests/ JSON key")
    if not request_key.endswith(".json") or any(
        part in ("", ".", "..") for part in request_key.split("/")
    ) or "\\" in request_key or "%" in request_key or "//" in request_key:
        raise ValueError("Unsafe request key")
    response = client().get_object(Bucket=os.environ["R2_BUCKET"], Key=request_key)
    if response["ContentLength"] > 100_000:
        raise ValueError("Request exceeds 100 KB")
    request = response["Body"].read(100_001).decode("utf8")
    return _process(request)


@app.local_entrypoint()
def main(request_path: str = "", request_key: str = ""):
    """Use exactly one of a local JSON file or private R2 requests/ key."""
    if bool(request_path) == bool(request_key):
        raise ValueError("Provide exactly one --request-path or --request-key")
    if request_key:
        result = prepare_from_r2.remote(request_key)
    else:
        request = Path(request_path).read_text(encoding="utf8")
        result = prepare_private_candidate.remote(request)
    print(json.dumps(result, indent=2, sort_keys=True))
    print("No public HUMKIN song or rotation was changed.")
