import LandingPage from "../page"

export default function PMPage() {
  return (
    <>
      <LandingPage />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-20">
        <img
          src="/PM.png"
          alt="Prime Minister"
          className="h-32 w-32 object-cover rounded-full shadow-md mb-4"
        />
        <h1 className="text-3xl font-bold text-gov-blue">Narendra Modi</h1>
        <p className="text-lg text-gray-600">Prime Minister of India</p>
      </main>
    </>
  )
}
