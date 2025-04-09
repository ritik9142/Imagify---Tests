import React from 'react'
import { assets } from '../assets/assets'
import { motion } from 'motion/react'

const Description = () => {
  return (
    <motion.div initial={{ opacity: 0.2, y: 100}}
                animate={{ duration: 1}} 
                whileInView={{ opacity: 1, y: 0}}
                viewport={{ once: true}} className='flex flex-col items-center justify-center my-24 p-6 md:px-28'>
      <h1 className='text-3xl sm:text-4xl font-semibold mb-2'>Generate AI Images</h1>
      <p className='text-gray-500 mb-8'>Turn your imagination into visuals</p>


      <div className='flex flex-col gap-5 md:gap-14 md:flex-row items-center'>
        <img src={assets.sample_img_1} alt="" className='w-80 xl:w-96 rounded-lg'/>

        <div>
            <h2 className='text-3xl font-medium max-w-lg mb-2'>Meet Your Instant Art Studio: AI Image-to-Image & Text-to-Image Magic</h2>
            <p className='text-gray-600 mb-4'>Turn daydreams into visuals faster than ever. No design skills? No problem. Our free AI generator transforms simple text into jaw-dropping images—ideal for social media, branding, or pure imagination.</p>
            <p className='text-gray-600'>Type a phrase (e.g., ‘cyberpunk cat café’ or ‘dreamy underwater wedding’), and watch our AI paint it into reality within seconds. Whether you’re prototyping products, designing characters, or exploring the impossible, this tool turns ‘what if’ into ‘here’s how.’ All powered by genius-level AI technology.</p>
            <p className='text-gray-600'>Upload an image, select your desired style, and let our AI transform it into a stunning masterpiece within seconds. Whether you're reimagining portraits, applying artistic filters, or exploring new creative horizons, this tool turns your vision into reality. All powered by cutting-edge AI technology.</p>
        </div>
      </div>
    </motion.div>
  )
}

export default Description
