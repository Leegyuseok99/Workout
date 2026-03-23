export default function ReportCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-6 rounded-2xl cursor-pointer
      bg-gradient-to-r from-green-100 to-gray-100
      hover:shadow-lg transition"
    >
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg">
          {icon}
        </div>

        <div>
          <p className="font-bold text-gray-800">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="text-gray-400 text-xl">›</div>
    </div>
  );
}
