import { parseEnclosingPricingValuesFromPages } from '@/domain/enclosing/model/enclosing-price-pdf-import'

describe('enclosing price pdf parser', () => {
  it('extracts enclosing pricing values used by calculator', () => {
    const pages = [
      `
      Прайс-лист № 1.7
      ПРОФИЛИРОВАННЫЙ И ПЛОСКИЙ ЛИСТ
      1 Плоский лист 1,000 0,960 1250 м.кв. 500
      `,
      `
      Прайс-лист №2
      1 Плоский лист ** 1250 0,9600 347,88 353,76 386,52 405,72 405,72 432,00 502,68 579,60 603,84 644,64 645,12 710,52 782,80 954,48 1 559,76
      `,
      `
      Прайс-лист №12.4
      9 Саморез 5.5х105 оцинк со сверлом 12 мм Гарпун шт. 100 39,1
      10 Саморез 5.5х115 оцинк со сверлом 12 мм Гарпун шт. 100 43,1
      11 Саморез 5.5х140 оцинк со сверлом 12 мм Гарпун шт. 100 51,9
      12 Саморез 5.5х160 оцинк со сверлом 12 мм Гарпун шт. 100 71,1
      13 Саморез 5.5х190 оцинк со сверлом 12 мм Гарпун шт. 100 94,8
      14 Саморез 5.5х240 оцинк со сверлом 12 мм Гарпун шт. 100 145,7
      15 Саморез 5.5х285 оцинк со сверлом 12 мм Гарпун шт. 100 188,9
      16 Саморез 5.5х350 оцинк со сверлом 12 мм Гарпун шт. 50 271,2
      `,
      `
      Прайс-лист №7
      8 Саморез 4,8х28 ROOFRetail шт. 250 4,55
      18 Саморез 4,8х28 ROOFRetail (цинк) шт. 250 4,00
      `,
      `
      Прайс-лист №12.5
      1 Уплотнитель МП ТСП-К-А шт. 55 На верхнюю облицовку кровельной ТСП
      3 Уплотнитель замкового соединения ТСП (8 мм х 30 м) уп. 90 Для стыка ТСП в замке
      `,
      `
      Прайс-лист №3.5
      26 Планка отлива цоколя 50х20х2000 шт. - 765 720 830 735
      `,
      `
      Прайс-лист №20
      7 Анкер фасадный Стандарт 10х100 (Т) Термодиффузия шт. 100 35,0
      `,
    ]

    const parsed = parseEnclosingPricingValuesFromPages(pages)

    expect(parsed.values.accessoryBaseFlatSheetPriceRubPerM2).toBe(500)
    expect(parsed.values.starterBaseFlatSheet2mmPriceRubPerM2).toBeCloseTo(1559.76, 2)
    expect(parsed.values.accessoryFastenerPriceRub).toBeCloseTo(4.55, 2)
    expect(parsed.values.lockGasketPackPriceRub).toBe(90)
    expect(parsed.values.roofProfileGasketPriceRub).toBe(55)
    expect(parsed.values.wallSocleDripPriceRubPerPiece).toBe(765)
    expect(parsed.values.socleAnchorBoltPriceRub).toBe(35)
    expect(parsed.values.harpoonPanelFastenerPriceRubByLengthMm?.[105]).toBeCloseTo(39.1, 1)
    expect(parsed.values.harpoonPanelFastenerPriceRubByLengthMm?.[350]).toBeCloseTo(271.2, 1)
    expect(parsed.extractedFields.length).toBeGreaterThan(5)
  })
})

