const Footer = () => {
  return (
    <footer className="bg-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="text-white text-sm mb-4 sm:mb-0">
            © 2025 GAUNT.GG. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-6 text-white text-sm">
            <a href="#" className="hover:text-gray-300 transition-colors">
              Fees
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              Responsible Play
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
