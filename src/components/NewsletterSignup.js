import React from 'react'

const NewsletterSignup = () => {
  return (
    <div className='py-10'>
      <h4 className="text-lg text-primary font-semibold text-center mb-4 font-heading">Join 10,000+ food lovers — get weekly recipe inspiration</h4>
      <form className="flex justify-center">
        <input
          type="email"
          placeholder="Enter your email"
          autoComplete="false"
          className="w-1/2 form-input"
          required
        />
        <button className="ml-2 btn">
          Send me the good stuff!
        </button>
      </form>
    </div>
  )
}

export default NewsletterSignup