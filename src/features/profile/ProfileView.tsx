export default function ProfileView({ user, onEdit, onClose }: any) {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Details</h2>
        <button onClick={onClose} className="text-red-500 font-bold">
          ✖
        </button>
      </div>
      <div className="flex-1 text-sm space-y-4">
        <div className="bg-gray-100 p-4 rounded text-center">
          <h3 className="text-2xl font-bold">{user.name}</h3>
          <p className="text-blue-600">{user.branch}</p>
        </div>
        <p>
          <strong>Phone:</strong> {user.phone}
        </p>
        <p>
          <strong>Status:</strong> {user.status}
        </p>
        <p>
          <strong>Iqama:</strong> {user.iqa}
        </p>
      </div>
      <button
        onClick={onEdit}
        className="w-full bg-yellow-500 text-white p-2 rounded font-bold"
      >
        Edit Profile
      </button>
    </div>
  );
}
