import modal
import os
from pathlib import Path

root_path = Path(__file__).parent.parent.parent

# Exclude local build artifacts and platform-specific binaries from the copy.
# node_modules is re-installed fresh inside the container.
IGNORE = [
    "node_modules",
    ".next",
    "dist",
    ".turbo",
    ".git",
    "*.tsbuildinfo",
    ".venv",
    "__pycache__",
]

image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg", "curl", "git")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt-get install -y nodejs",
        "npm install -g pnpm"
    )
    # copy=True is required when run_commands follow add_local_dir
    .add_local_dir(root_path, "/root/app", copy=True, ignore=IGNORE)
    .workdir("/root/app")
    .run_commands(
        "cd /root/app && pnpm install --frozen-lockfile",
    )
)

app = modal.App("video-render", image=image)

@app.function(
    image=image,
    secrets=[modal.Secret.from_dotenv(root_path / ".env")],
    timeout=1200,  # 20 minutes
    cpu=2.0,
    memory=2048,
    env={"MODAL_ENVIRONMENT": "true"},
)
def render(video_id: str, narration_id: str):
    import subprocess

    print(f"Starting remote render for video_id={video_id}, narration_id={narration_id}")

    cmd = [
        "pnpm",
        "--filter",
        "@pet-pov/worker",
        "exec",
        "tsx",
        "src/bin/render-standalone.ts",
        video_id,
        narration_id,
    ]

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    if process.stdout:
        for line in process.stdout:
            print(f"[node] {line.strip()}")

    returncode = process.wait()

    if returncode != 0:
        raise Exception(f"Render failed with exit code {returncode}")

    return {"status": "success", "video_id": video_id}

@app.local_entrypoint()
def test_local(video_id: str, narration_id: str):
    """
    modal run infra/modal/video_render.py --video-id <ID> --narration-id <ID>
    """
    print(f"Triggering remote render for {video_id}...")
    result = render.remote(video_id, narration_id)
    print(f"Result: {result}")
