export default function SubmissionFilesList({ files = [] }) {
  if (!files.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">Files</h4>

      {files.map((file) => (
        <div
          key={file.id}
          className="flex justify-between items-center border p-2 rounded-md text-sm"
        >
          <span>{file.originalName}</span>
          <span className="text-xs text-gray-500">
            {(file.sizeBytes / 1024).toFixed(1)} KB
          </span>
        </div>
      ))}
    </div>
  );
}