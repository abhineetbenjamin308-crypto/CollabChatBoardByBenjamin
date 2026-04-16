import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 px-4 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center py-20">
        <section className="w-full space-y-12">
          <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/10 p-8 text-center shadow-lg backdrop-blur-md md:p-10">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white md:text-6xl">
                CollabChat Board
              </h1>
              <p className="text-lg text-gray-300">
                Real-time chat and collaborative whiteboard for your team. Draw together, discuss ideas, and leverage AI insights.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:justify-center">
          <Link
            to="/login"
                className="w-full rounded-full bg-white/10 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-white/20 hover:shadow-md md:w-auto"
          >
            Login
          </Link>
          <Link
            to="/signup"
                className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-indigo-400 hover:to-pink-500 hover:shadow-md md:w-auto"
          >
            Sign Up
          </Link>
            </div>
          </div>
        </section>
        </div>
      </div>
  )
}
