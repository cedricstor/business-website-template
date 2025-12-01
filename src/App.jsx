import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Footer, Navbar } from './components'
import { ToolsPage, Features, Home, Product } from './pages'
import styles from './style'

const App = () => {
  return (
    <div className='bg-primary w-full overflow-hidden'>
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <Navbar />
        </div>
      </div>
      <div className={`bg-primary ${styles.flexStart}`}>
        <div className='w-full'>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/features' element={<Features />} />
            <Route path='/ari-ekstein' element={<Product />} />
            <Route path='/tools' element={<ToolsPage />} />
          </Routes>
        </div>
      </div>
      <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default App
