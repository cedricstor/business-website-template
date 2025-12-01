import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from '../style'

const toNumber = (value) => {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

const formatNumber = (value) =>
  Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '--'

const KG_PER_LB = 0.453592
const LB_PER_KG = 2.20462

const ToolsPage = () => {
  const [seedInputs, setSeedInputs] = useState({
    weightKg: '100',
    weightUnit: 'kg',
    costPerKg: '2.5',
    marginPct: '20',
  })
  const [visibleSections, setVisibleSections] = useState({
    seed: false,
    revenue: false,
    mix: false,
  })
  const [scrollTarget, setScrollTarget] = useState(null)

  const [splitInputs, setSplitInputs] = useState({
    total: '10000',
    growerPct: '60',
  })

  const [mixInputs, setMixInputs] = useState({
    totalWeight: '100',
    weightUnit: 'kg',
    mixingFee: '0.25',
    splits: [
      { id: 1, pct: '90', price: '2.5' },
      { id: 2, pct: '5', price: '3.0' },
      { id: 3, pct: '5', price: '3.5' },
    ],
  })

  const seedCalc = useMemo(() => {
    const weightInput = Math.max(toNumber(seedInputs.weightKg), 0)
    const weightKg = seedInputs.weightUnit === 'kg' ? weightInput : weightInput * KG_PER_LB
    const weightLbs = weightKg * LB_PER_KG
    const costPerKg = toNumber(seedInputs.costPerKg)
    const marginPct = toNumber(seedInputs.marginPct)

    const baseCost = weightKg * costPerKg
    const salePrice = baseCost * (1 + marginPct / 100)
    const costPerBag25kg = costPerKg * 25
    const salePerBag25kg = costPerBag25kg * (1 + marginPct / 100)

    return { baseCost, salePrice, costPerBag25kg, salePerBag25kg, weightKg, weightLbs }
  }, [seedInputs])

  const splitCalc = useMemo(() => {
    const total = toNumber(splitInputs.total)
    const growerPct = Math.min(Math.max(toNumber(splitInputs.growerPct), 0), 100)
    const partnerPct = 100 - growerPct
    const growerAmount = (total * growerPct) / 100
    const partnerAmount = total - growerAmount

    return { total, growerPct, partnerPct, growerAmount, partnerAmount }
  }, [splitInputs])

  const handleSeedChange = (key) => (e) => {
    setSeedInputs((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSplitChange = (key) => (e) => {
    setSplitInputs((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleMixFieldChange = (key) => (e) => {
    setMixInputs((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSeedUnitChange = (e) => {
    setSeedInputs((prev) => ({ ...prev, weightUnit: e.target.value }))
  }

  const handleMixUnitChange = (e) => {
    setMixInputs((prev) => ({ ...prev, weightUnit: e.target.value }))
  }

  const handleMixSplitChange = (id, key) => (e) => {
    setMixInputs((prev) => ({
      ...prev,
      splits: prev.splits.map((split) =>
        split.id === id ? { ...split, [key]: e.target.value } : split
      ),
    }))
  }

  const addSplit = () => {
    setMixInputs((prev) => ({
      ...prev,
      splits: [
        ...prev.splits,
        { id: Date.now(), pct: '0', price: '0' },
      ],
    }))
  }

  const removeSplit = (id) => {
    setMixInputs((prev) => ({
      ...prev,
      splits: prev.splits.length > 1 ? prev.splits.filter((s) => s.id !== id) : prev.splits,
    }))
  }

  const mixCalc = useMemo(() => {
    const totalInput = Math.max(toNumber(mixInputs.totalWeight), 0)
    const totalWeightKg = mixInputs.weightUnit === 'kg' ? totalInput : totalInput * KG_PER_LB
    const totalWeightLbs = totalWeightKg * LB_PER_KG
    const mixingFee = Math.max(toNumber(mixInputs.mixingFee), 0)

    const splits = mixInputs.splits.map((split) => {
      const pct = Math.max(toNumber(split.pct), 0)
      const price = Math.max(toNumber(split.price), 0)
      const weightKg = (totalWeightKg * pct) / 100
      const weightLbs = weightKg * LB_PER_KG
      const cost = weightKg * price
      return { ...split, pct, price, weightKg, weightLbs, cost }
    })

    const pctTotal = splits.reduce((sum, s) => sum + s.pct, 0)
    const splitCostTotal = splits.reduce((sum, s) => sum + s.cost, 0)
    const mixingCostTotal = mixingFee * totalWeightKg
    const grandTotal = splitCostTotal + mixingCostTotal
    const pricePerKg = totalWeightKg > 0 ? grandTotal / totalWeightKg : 0
    const pricePerLb = pricePerKg / LB_PER_KG

    return {
      splits,
      pctTotal,
      splitCostTotal,
      mixingCostTotal,
      grandTotal,
      pricePerKg,
      totalWeightKg,
      totalWeightLbs,
      pricePerLb,
    }
  }, [mixInputs])

  const seedSectionRef = useRef(null)
  const revenueSectionRef = useRef(null)
  const mixSectionRef = useRef(null)
  const sectionRefs = useMemo(
    () => ({
      seed: seedSectionRef,
      revenue: revenueSectionRef,
      mix: mixSectionRef,
    }),
    []
  )

  const toggleSection = (sectionKey) => {
    setVisibleSections((prev) => {
      const nextState = !prev[sectionKey]
      if (nextState) {
        setScrollTarget(sectionKey)
      } else {
        setScrollTarget(null)
      }
      return { ...prev, [sectionKey]: nextState }
    })
  }

  useEffect(() => {
    if (!scrollTarget) return
    const targetRef = sectionRefs[scrollTarget]
    if (visibleSections[scrollTarget] && targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setScrollTarget(null)
    }
  }, [scrollTarget, visibleSections, sectionRefs])

  return (
    <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
      <div className={`${styles.boxWidth} py-16 space-y-12`}>
        <header>
          <p className='text-secondary uppercase font-semibold tracking-[2px] mb-2'>Tools</p>
          <h1 className='text-4xl sm:text-5xl font-poppins font-semibold text-body mb-4'>
            Seed math & pricing desk
          </h1>
          <p className={`${styles.paragraph} max-w-[720px]`}>
            Run quick calculations for seed pricing and revenue sharing. Update the inputs and the
            results will refresh instantly.
          </p>
        </header>

        <div className='grid gap-3 sm:grid-cols-3'>
          <div className='rounded-2xl bg-black-gradient p-4 border border-dimBlue'>
            <button
              type='button'
              onClick={() => toggleSection('seed')}
              className='w-full rounded-lg border border-secondary text-secondary px-4 py-2 font-semibold hover:border-secondary/80 hover:text-secondary/80 transition'
            >
              Seed pricing calculator
            </button>
          </div>
          <div className='rounded-2xl bg-black-gradient p-4 border border-dimBlue'>
            <button
              type='button'
              onClick={() => toggleSection('revenue')}
              className='w-full rounded-lg border border-secondary text-secondary px-4 py-2 font-semibold hover:border-secondary/80 hover:text-secondary/80 transition'
            >
              Revenue split calculator Partners
            </button>
          </div>
          <div className='rounded-2xl bg-black-gradient p-4 border border-dimBlue'>
            <button
              type='button'
              onClick={() => toggleSection('mix')}
              className='w-full rounded-lg border border-secondary text-secondary px-4 py-2 font-semibold hover:border-secondary/80 hover:text-secondary/80 transition'
            >
              Seed mix splitter
            </button>
          </div>
        </div>

        <section className='grid gap-6 lg:grid-cols-2'>
          <div
            ref={sectionRefs.seed}
            className={`rounded-2xl bg-black-gradient p-6 border border-dimBlue ${visibleSections.seed ? '' : 'hidden'}`}
          >
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-2xl font-semibold text-body'>Seed pricing calculator</h2>
              <span className='text-secondary text-sm'>Instant math</span>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='flex flex-col text-muted text-sm gap-1'>
                Batch weight
                <input
                  type='number'
                  min='0'
                  className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                  value={seedInputs.weightKg}
                  onChange={handleSeedChange('weightKg')}
                />
              </label>
              <label className='flex flex-col text-muted text-sm gap-1'>
                Unit
                <select
                  className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                  value={seedInputs.weightUnit}
                  onChange={handleSeedUnitChange}
                >
                  <option value='kg'>Kilograms</option>
                  <option value='lb'>Pounds</option>
                </select>
              </label>
              <label className='flex flex-col text-muted text-sm gap-1'>
                Cost per kg ($)
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                  value={seedInputs.costPerKg}
                  onChange={handleSeedChange('costPerKg')}
                />
              </label>
              <label className='flex flex-col text-muted text-sm gap-1'>
                Margin (%)
                <input
                  type='number'
                  min='0'
                  step='1'
                  className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                  value={seedInputs.marginPct}
                  onChange={handleSeedChange('marginPct')}
                />
              </label>
            </div>
            <div className='mt-6 grid gap-3 sm:grid-cols-2'>
              <ResultCard
                label='Batch weight'
                value={`${formatNumber(seedCalc.weightKg)} kg / ${formatNumber(seedCalc.weightLbs)} lb`}
              />
              <ResultCard
                label='Total cost (batch)'
                value={`$${formatNumber(seedCalc.baseCost)}`}
              />
              <ResultCard
                label='Sale price (batch)'
                value={`$${formatNumber(seedCalc.salePrice)}`}
              />
              <ResultCard
                label='Cost per 25kg bag'
                value={`$${formatNumber(seedCalc.costPerBag25kg)}`}
              />
              <ResultCard
                label='Sale per 25kg bag'
                value={`$${formatNumber(seedCalc.salePerBag25kg)}`}
              />
            </div>
          </div>

          <div
            ref={sectionRefs.revenue}
            className={`rounded-2xl bg-black-gradient p-6 border border-dimBlue ${visibleSections.revenue ? '' : 'hidden'}`}
          >
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-2xl font-semibold text-body'>Revenue split calculator</h2>
              <span className='text-secondary text-sm'>Partners</span>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='flex flex-col text-muted text-sm gap-1'>
                Total amount ($)
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                  value={splitInputs.total}
                  onChange={handleSplitChange('total')}
                />
              </label>
              <label className='flex flex-col text-muted text-sm gap-1'>
                Grower share (%)
                <input
                  type='number'
                  min='0'
                  max='100'
                  step='1'
                  className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                  value={splitInputs.growerPct}
                  onChange={handleSplitChange('growerPct')}
                />
              </label>
            </div>
            <div className='mt-6 grid gap-3 sm:grid-cols-2'>
              <ResultCard
                label='Grower amount'
                value={`$${formatNumber(splitCalc.growerAmount)} (${formatNumber(splitCalc.growerPct)}%)`}
              />
              <ResultCard
                label='Partner amount'
                value={`$${formatNumber(splitCalc.partnerAmount)} (${formatNumber(splitCalc.partnerPct)}%)`}
              />
            </div>
          </div>
        </section>

        <section
          ref={sectionRefs.mix}
          className={`rounded-2xl bg-black-gradient p-6 border border-dimBlue ${visibleSections.mix ? '' : 'hidden'}`}
        >
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-2xl font-semibold text-body'>Seed mix splitter</h2>
            <span className='text-secondary text-sm'>100% check</span>
          </div>
          <p className={`${styles.paragraph} mb-6 max-w-[780px]`}>
            Enter percentage splits that add up to 100%, then set your total batch weight and price per kg for each split. The tool returns the weight per split, cost per split, and total mix cost with a mixing fee.
          </p>

          <div className='grid gap-4 sm:grid-cols-4'>
            <label className='flex flex-col text-muted text-sm gap-1'>
              Total weight
              <input
                type='number'
                min='0'
                className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                value={mixInputs.totalWeight}
                onChange={handleMixFieldChange('totalWeight')}
              />
            </label>
            <label className='flex flex-col text-muted text-sm gap-1'>
              Unit
              <select
                className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                value={mixInputs.weightUnit}
                onChange={handleMixUnitChange}
              >
                <option value='kg'>Kilograms</option>
                <option value='lb'>Pounds</option>
              </select>
            </label>
            <label className='flex flex-col text-muted text-sm gap-1'>
              Mixing fee ($/kg)
              <input
                type='number'
                min='0'
                step='0.01'
                className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                value={mixInputs.mixingFee}
                onChange={handleMixFieldChange('mixingFee')}
              />
            </label>
            <div className='flex items-end'>
              <button
                onClick={addSplit}
                className='w-full rounded-lg border border-secondary text-secondary px-3 py-2 font-medium'
              >
                Add seed split
              </button>
            </div>
          </div>

          <div className='mt-6 space-y-3'>
            {mixCalc.splits.map((split, idx) => (
              <div
                key={split.id}
                className='grid gap-3 sm:grid-cols-[1fr,1fr,1fr,auto] items-end rounded-xl bg-primary/60 border border-dimBlue px-3 py-3'
              >
                <label className='flex flex-col text-muted text-sm gap-1'>
                  Percent (%)
                  <input
                    type='number'
                    min='0'
                    max='100'
                    className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                    value={split.pct}
                    onChange={handleMixSplitChange(split.id, 'pct')}
                  />
                </label>
                <label className='flex flex-col text-muted text-sm gap-1'>
                  Price per kg ($)
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    className='rounded-lg bg-primary/80 border border-dimBlue px-3 py-2 text-body'
                    value={split.price}
                    onChange={handleMixSplitChange(split.id, 'price')}
                  />
                </label>
                <div className='flex flex-col text-muted text-sm gap-1'>
                  Weight (kg / lb)
                  <div className='rounded-lg bg-primary/40 border border-dimBlue px-3 py-2 text-body'>
                    {formatNumber(split.weightKg)} kg / {formatNumber(split.weightLbs)} lb
                  </div>
                </div>
                <div className='flex items-center justify-between gap-2 sm:justify-end'>
                  <div className='text-secondary text-sm font-semibold'>
                    ${formatNumber(split.cost)}
                  </div>
                  {mixCalc.splits.length > 1 && (
                    <button
                      onClick={() => removeSplit(split.id)}
                      className='text-xs text-muted hover:text-secondary'
                    >
                      Remove
                    </button>
                  )}
                </div>
                {idx === mixCalc.splits.length - 1 && (
                  <div className='sm:col-span-4 text-right text-xs text-muted'>
                    Percent running total: {formatNumber(mixCalc.pctTotal)}%
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className='mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            <ResultCard label='Percent total' value={`${formatNumber(mixCalc.pctTotal)}%`} />
            <ResultCard
              label='Mixing fee total'
              value={`$${formatNumber(mixCalc.mixingCostTotal)}`}
            />
            <ResultCard label='Split costs subtotal' value={`$${formatNumber(mixCalc.splitCostTotal)}`} />
            <ResultCard label='Grand total' value={`$${formatNumber(mixCalc.grandTotal)}`} />
            <ResultCard
              label='Blended price per kg'
              value={`$${formatNumber(mixCalc.pricePerKg)}`}
            />
            <ResultCard
              label='Total weight'
              value={`${formatNumber(mixCalc.totalWeightKg)} kg / ${formatNumber(mixCalc.totalWeightLbs)} lb`}
            />
            <ResultCard
              label='Blended price per lb'
              value={`$${formatNumber(mixCalc.pricePerLb)}`}
            />
          </div>

          {mixCalc.pctTotal !== 100 && (
            <p className='mt-3 text-sm text-secondary'>
              Heads up: your percentages add to {formatNumber(mixCalc.pctTotal)}%. Adjust until it equals 100% for accurate splits.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

const ResultCard = ({ label, value }) => (
  <div className='rounded-xl bg-primary/60 border border-dimBlue px-4 py-3'>
    <p className='text-muted text-xs uppercase tracking-[1px] mb-1'>{label}</p>
    <p className='text-body text-xl font-semibold'>{value}</p>
  </div>
)

export default ToolsPage
