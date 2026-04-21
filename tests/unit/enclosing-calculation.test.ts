import { calculateEnclosing } from '@/domain/enclosing/model/calculate-enclosing'
import { mapUnifiedInputToEnclosingInput } from '@/domain/enclosing/model/enclosing-mapper'

describe('enclosing calculation', () => {
  it('builds class-based wall and roof specifications with pieces, length, mass and price', () => {
    const result = calculateEnclosing({
      roofType: 'двускатная',
      spanM: 24,
      buildingLengthM: 60,
      buildingHeightM: 10,
      frameStepM: 6,
      roofSlopeDeg: 6,
      wallPanelThicknessMm: 100,
      roofPanelThicknessMm: 150,
      openingsAreaM2: 189,
    })

    expect(result.geometry.wallAreaGrossM2).toBeCloseTo(1710.27, 2)
    expect(result.geometry.wallAreaNetM2).toBeCloseTo(1521.27, 2)
    expect(result.geometry.roofAreaM2).toBeCloseTo(1447.93, 2)

    const class1 = result.classes['class-1-gost']
    expect(class1.walls.panelSpecification[0]?.mark).toBe('МП ТСП-Z')
    expect(class1.walls.panelSpecification[0]?.panelLengthM).toBeCloseTo(6, 2)
    expect(class1.walls.panelSpecification[0]?.panelsCount).toBe(254)
    expect(class1.walls.panelSpecification[0]?.workingWidthMm).toBe('1000')
    expect(class1.walls.panelSpecification[0]?.unitMassKgPerM2).toBeCloseTo(18.35, 2)
    expect(class1.walls.panelSpecification[0]?.unitPriceRubPerM2).toBe(3905)
    expect(class1.roof.panelSpecification[0]?.mark).toBe('МП ТСП-К')
    expect(class1.roof.panelSpecification[0]?.unitPriceRubPerM2).toBe(4705)

    expect(class1.totals.panelsRub).toBe(12753079)
    expect(class1.walls.fasteners[0]?.lengthMm).toBe(190)
    expect(class1.walls.fasteners[0]?.quantity).toBe(1524)
    expect(class1.walls.fasteners[0]?.unitPriceRub).toBeCloseTo(94.8, 1)
    expect(class1.roof.fasteners[0]?.lengthMm).toBe(240)
    expect(class1.roof.fasteners[0]?.quantity).toBe(3840)
    expect(class1.roof.fasteners[0]?.unitPriceRub).toBeCloseTo(145.7, 1)
    expect(class1.walls.fasteners[1]?.quantity).toBe(2054)
    expect(class1.walls.fasteners[1]?.unitPriceRub).toBeCloseTo(4.55, 2)
    expect(class1.roof.fasteners[1]?.quantity).toBe(1361)

    const lapFastenerRow = class1.roof.fasteners.find((row) => row.key.includes('lap-fastener'))
    expect(lapFastenerRow?.lengthMm).toBe(28)
    expect(lapFastenerRow?.quantity).toBe(2848)
    expect(lapFastenerRow?.unitPriceRub).toBeCloseTo(4.55, 2)

    const socleAnchorRow = class1.walls.fasteners.find((row) => row.key.includes('socle-anchor-bolt'))
    expect(socleAnchorRow?.lengthMm).toBe(100)
    expect(socleAnchorRow?.quantity).toBeGreaterThan(0)
    expect(socleAnchorRow?.unitPriceRub).toBe(35)

    expect(class1.walls.accessories.length).toBeGreaterThan(0)
    expect(class1.roof.accessories.length).toBeGreaterThan(0)
    expect(class1.walls.accessories.some((row) => row.item.includes('отлива цоколя'))).toBe(true)
    expect(class1.walls.accessories.some((row) => row.item.includes('ФИ11'))).toBe(true)
    expect(class1.roof.accessories.some((row) => row.item.includes('ФИ28'))).toBe(true)
  })

  it('keeps only metal fastener logic and does not expose concrete fasteners', () => {
    const result = calculateEnclosing({
      roofType: 'двускатная',
      spanM: 24,
      buildingLengthM: 60,
      buildingHeightM: 10,
      frameStepM: 6,
      roofSlopeDeg: 6,
      wallPanelThicknessMm: 100,
      roofPanelThicknessMm: 150,
      openingsAreaM2: 0,
    })

    const serialized = JSON.stringify(result)
    expect(serialized.includes('concrete')).toBe(false)
    expect(result.classes['class-1-gost'].walls.fasteners[0]?.item).toContain('МП ТСП-Z')
    expect(result.notes.some((note) => note.toLowerCase().includes('оценоч'))).toBe(false)
    expect(result.notes.some((note) => note.includes('12.4'))).toBe(true)
  })

  it('maps unified input to enclosing input and resolves openings area', () => {
    const mapped = mapUnifiedInputToEnclosingInput({
      roofType: 'двускатная',
      spanM: 24,
      buildingLengthM: 60,
      buildingHeightM: 10,
      frameStepM: 6,
      roofPurlinStepM: 2,
      roofSlopeDeg: 6,
      wallCoveringType: 'С-П 120 мм',
      roofCoveringType: 'С-П 170 мм',
      doubleDoorAreaM2: 12,
      singleDoorCount: 4,
      entranceBlockAreaM2: 8,
      tambourDoorAreaM2: 6,
      windowsAreaM2: 120,
      gatesAreaM2: 35,
    })

    expect(mapped.wallPanelThicknessMm).toBe(120)
    expect(mapped.roofPanelThicknessMm).toBe(170)
    expect(mapped.frameStepM).toBe(6)
    expect(mapped.roofPurlinStepM).toBe(2)
    expect(mapped.openingsAreaM2).toBe(189)
  })

  it('falls back to nearest available class-2 roof thickness when exact value is not priced', () => {
    const result = calculateEnclosing({
      roofType: 'двускатная',
      spanM: 24,
      buildingLengthM: 60,
      buildingHeightM: 10,
      frameStepM: 6,
      roofSlopeDeg: 6,
      wallPanelThicknessMm: 100,
      roofPanelThicknessMm: 60,
      openingsAreaM2: 0,
    })

    const class2RoofRow = result.classes['class-2-tu'].roof.panelSpecification[0]
    expect(class2RoofRow?.thicknessMm).toBe(80)
    expect(result.notes.some((note) => note.includes('80'))).toBe(true)
  })

  it('supports unified input versions without opening fields', () => {
    const mapped = mapUnifiedInputToEnclosingInput({
      roofType: 'двускатная',
      spanM: 24,
      buildingLengthM: 60,
      buildingHeightM: 10,
      roofSlopeDeg: 6,
      wallCoveringType: 'С-П 100 мм',
      roofCoveringType: 'С-П 150 мм',
    })

    expect(mapped.openingsAreaM2).toBe(0)
    expect(mapped.wallPanelThicknessMm).toBe(100)
    expect(mapped.roofPanelThicknessMm).toBe(150)
    expect(mapped.frameStepM).toBe(6)
    expect(mapped.roofPurlinStepM).toBe(1.5)
  })

  it('reduces roof panel fastener quantity when purlin step is increased', () => {
    const defaultStepResult = calculateEnclosing({
      roofType: 'двускатная',
      spanM: 24,
      buildingLengthM: 60,
      buildingHeightM: 10,
      frameStepM: 6,
      roofPurlinStepM: 1.5,
      roofSlopeDeg: 6,
      wallPanelThicknessMm: 100,
      roofPanelThicknessMm: 150,
      openingsAreaM2: 0,
    })

    const largerStepResult = calculateEnclosing({
      roofType: 'двускатная',
      spanM: 24,
      buildingLengthM: 60,
      buildingHeightM: 10,
      frameStepM: 6,
      roofPurlinStepM: 3,
      roofSlopeDeg: 6,
      wallPanelThicknessMm: 100,
      roofPanelThicknessMm: 150,
      openingsAreaM2: 0,
    })

    const defaultStepFasteners = defaultStepResult.classes['class-1-gost'].roof.fasteners[0]?.quantity ?? 0
    const largerStepFasteners = largerStepResult.classes['class-1-gost'].roof.fasteners[0]?.quantity ?? 0

    expect(defaultStepFasteners).toBe(3840)
    expect(largerStepFasteners).toBe(2400)
    expect(largerStepFasteners).toBeLessThan(defaultStepFasteners)
  })
})
