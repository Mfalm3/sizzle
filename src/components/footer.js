import { Link } from "gatsby"
import React from "react"
import { SocialIcon } from 'react-social-icons/component'

const Footer = () => {
  return (
    <footer className="px-10 divide-y divide-primary">
      <div className="flex flex-col md:flex-row lg:justify-between py-10">

        <div className="flex gap-4 text-4xl">
          <span>🍝</span>
          <span>🍜</span>
          <span>🍗</span>
          <span>🍴</span>
        </div>

        <div>
          <ul>
            <li className="text-primary hover:text-accent hover:underline"><Link to="#">About Us</Link></li>
            <li className="text-primary hover:text-accent hover:underline"><Link to="#">Privacy Policy</Link></li>
            <li className="text-primary hover:text-accent hover:underline"><Link to="#">Terms of service</Link></li>
            <li className="text-primary hover:text-accent hover:underline"><Link to="#">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-accent font-body font-semibold">Follow us</p>
          <div className="flex gap-2.5">
            <SocialIcon className="!h-8 !w-8" network="instagram" />
            <SocialIcon className="!h-8 !w-8" network="youtube" />
            <SocialIcon className="!h-8 !w-8" network="x" />
            <SocialIcon className="!h-8 !w-8" network="facebook" />
            <SocialIcon className="!h-8 !w-8" network="pinterest" />
          </div>
        </div>
      </div>

      <div className="flex justify-between py-2.5">
        <div>Recipe World 🍜</div>

        <div>
          Made with ❤ by <a href="https://github.com/mfalm3">Mfalm3</a>
        </div>

        <div>
          Credits
        </div>
      </div>
    </footer>
  )
}

export default Footer
