const StatsBanner = () => {
  const stats = [
    {
      value: "10%",
      label: "Platform Fee"
    },
    {
      value: "1v1",
      label: "Skill-Based Matches"
    },
    {
      value: "OCE+",
      label: "Regions Supported"
    }
  ]

  return (
    <section className="bg-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-white text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default StatsBanner
