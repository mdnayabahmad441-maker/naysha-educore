export default function Unauthorized(){
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">
      <div className="bg-white/10 p-8 rounded-xl border border-white/10 text-center">
        <h1 className="text-xl font-semibold mb-2">
          Access Denied 🚫
        </h1>
        <p className="text-gray-400">
          You don’t have permission to access this page.
        </p>
      </div>
    </div>
  )
}