import { UploadForm } from "../../components/upload-form";

export default function UploadPage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-2">Upload Pet Video</h1>
      <p className="text-muted-foreground mb-8">
        Upload your pet&apos;s footage to start the AI pipeline.
        Supported formats: MP4, MOV, WebM (max 500 MB).
      </p>
      <UploadForm />
    </div>
  );
}
