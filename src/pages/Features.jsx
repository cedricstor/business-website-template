import React from 'react'
import { Business, CardDeal, CTA } from '../components'
import styles from '../style'

const Features = () => {
  return (
    <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
      <div className={`${styles.boxWidth}`}>
        <Business />
        <CardDeal />
        <CTA />
      </div>
    </div>
  )
}

export default Features
