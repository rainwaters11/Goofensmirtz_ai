import { SectionHeader } from "../../components/section-header";
import { UploadCard } from "../../components/upload/upload-card";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-xl">
      <SectionHeader
        className="mb-8"
        title="Upload pet footage"
        description="Supported formats: MP4, MOV, WebM · Max 500 MB"
      />
      <UploadCard />
    </div>
  );
}
