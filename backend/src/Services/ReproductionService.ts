import { request } from '#/endpoints'
import { getRequestFormatedTimestamp } from '#/utils'


export class ReproductionService {

  private token: string
  private farm: string

  constructor(options: {
    token: string,
    farm: string
  }) {
    this.token = options.token
    this.farm = options.farm
  }


  protected extractTimeZone = (date: Date): string => {

    const timezonesOffset: { [key: string]: string } = {
      '-0500': 'America/Lima',           // Peru Time
      '-0400': 'America/Santiago',       // Chile Standard Time
      '-0430': 'America/Caracas',        // Venezuela Time
      '-0300': 'America/Sao_Paulo',      // Brasília Time
      '-0200': 'America/Noronha',        // Fernando de Noronha Time
      '-0100': 'Atlantic/Azores',        // Azores Time
      '+0000': 'UTC',                    // Coordinated Universal Time
      '+0100': 'Europe/Berlin',          // Central European Time
      '+0200': 'Europe/Helsinki',        // Eastern European Time
      '+0300': 'Europe/Moscow',          // Moscow Standard Time
      '+0330': 'Asia/Tehran',            // Iran Standard Time
      '+0400': 'Asia/Dubai',             // Gulf Standard Time
      '+0430': 'Asia/Kabul',             // Afghanistan Time
      '+0500': 'Asia/Karachi',           // Pakistan Standard Time
      '+0530': 'Asia/Kolkata',           // India Standard Time
      '+0545': 'Asia/Kathmandu',         // Nepal Time
      '+0600': 'Asia/Almaty',            // Kazakhstan Time
      '+0630': 'Asia/Yangon',            // Myanmar Time
      '+0700': 'Asia/Bangkok',           // Indochina Time
      '+0800': 'Asia/Shanghai',          // China Standard Time
      '+0900': 'Asia/Tokyo',             // Japan Standard Time
      '+0930': 'Australia/Darwin',       // Australian Central Standard Time
      '+1000': 'Australia/Sydney',       // Australian Eastern Standard Time
      '+1030': 'Australia/Lord_Howe',    // Lord Howe Island Time
      '+1100': 'Pacific/Noumea',         // New Caledonia Time
      '+1200': 'Pacific/Auckland',       // New Zealand Standard Time
      '+1245': 'Pacific/Chatham'         // Chatham Islands Time
    }

    const offset = date.getTimezoneOffset()
    const absoluteOffset = Math.abs(offset)
    const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0')
    const minutes = String(absoluteOffset % 60).padStart(2, '0')
    const sign = offset <= 0 ? '+' : '-'
    const timezone = timezonesOffset[`${sign}${hours}${minutes}`]
    if (timezone) {
      return timezone
    }
    throw new Error('Invalid date-time format or unsupported timezone offset')
  }

  protected formatDate = (hour: number, date: Date) => {
    const dateObj = new Date(date.getTime())
    dateObj.setHours(hour, 0, 0, 0)
    return dateObj.toLocaleString('pt-BR', {
      timeZone: this.extractTimeZone(date),
      timeZoneName: 'short'
    })
  }

  protected datesFromRecommendation = (recommendation: null | {
    hour: number,
    recommended: boolean
  }[], timestamp: Date): { from: Date, until: Date } | null => {

    if (recommendation === undefined || recommendation === null) {
      return null
    }

    let reduced = recommendation.reduce((acc: { from?: number, until?: number }, { hour, recommended }) => {
      if (recommended) {
        if (acc.from === undefined) {
          acc.from = hour
        }
        acc.until = hour
      }
      return acc
    }, {})

    if (!reduced.from || !reduced.until) {
      return null
    }

    const from_date = new Date(timestamp.getTime())

    if (timestamp.getHours() > (reduced.from)) {
      from_date.setDate(from_date.getDate() + 1)
    }
    from_date.setHours(reduced.from + 3, 0, 0, 0)

    const until_date = new Date(from_date.getTime())

    if (from_date.getHours() > (reduced.until)) {
      until_date.setDate(until_date.getDate() + 1)
    }
    until_date.setHours(reduced.until + 3, 0, 0, 0)

    return {
      from: from_date,
      until: until_date
    }
  }

  protected dateIsPast = (date?: Date | null): boolean => {
    return !!date && (date.getTime() <= (new Date()).getTime())
  }

  protected getLatestRecommendationDate = (
    conventional_until_date?: Date,
    sexed_until_date?: Date
  ) => {
    if ((conventional_until_date === undefined) && (sexed_until_date === undefined)) {
      return null
    } else if (conventional_until_date === undefined) {
      return sexed_until_date
    } else if (sexed_until_date === undefined) {
      return conventional_until_date
    } else {
      return (conventional_until_date.getTime() > sexed_until_date.getTime())
        ? conventional_until_date
        : sexed_until_date
    }
  }

  protected reduceServiceRecommendation = (from_date?: Date, until_date?: Date) => {

    if (from_date === undefined || until_date === undefined) {
      return null
    }

    return {
      from: from_date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        timeZoneName: 'short'
      }),
      until: until_date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        timeZoneName: 'short'
      })
    }
  }

  showHeatDetails = async (options: {
    heat: string
  })=> {
    return request({
      endpoint: 'heat-details',
      params: { farm: this.farm, heat: options.heat },
      auth: this.token,
    }).then(res => ({
      data: res.data.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }

  confirmHeat = async (options: {
    heat: string
    heat_intensity?: string,
    heat_detection_method?: string,
    heat_signs?: string[],
    comments?: string,
  })=> {
    return request({
      endpoint: 'confirm-heat',
      method: 'post',
      params: { farm: this.farm, heat: options.heat },
      auth: this.token,
      body: {
        action: 'confirm',
        advanced: (!!options.heat_signs || !!options.heat_detection_method || !!options.heat_intensity) || false,
        comment: options.comments || null,
        heat_detection_method: options.heat_detection_method || null,
        heat_intensity: options.heat_intensity || null,
        heat_signs: options.heat_signs || []
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }
  dismissHeat = async (options: {
    heat: string
  })=> {
    return request({
      endpoint: 'confirm-heat',
      method: 'post',
      params: { farm: this.farm, heat: options.heat },
      auth: this.token,
      body: {
        action: 'confirm-negatively',
        advanced: false,
        comment: null,
        heat_detection_method: null,
        heat_intensity: null,
        heat_signs: []
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }

  storeInsemination = async (options: {
    animal: string
    comments?: string,
    semen_type: string,
    timestamp?: Date|string
  })=> {
    return request({
      endpoint: 'store-reproduction',
      method: 'post',
      params: { farm: this.farm, animal: options.animal },
      auth: this.token,
      body: {
        comment: options.comments,
        event_code: 'reproduction.inseminated',
        timestamp: getRequestFormatedTimestamp(options.timestamp || new Date),
        inseminator_id: null,
        semen: {
          bull_semen_id: null,
          semen_type: options.semen_type
        }
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }

  storeEmbryoTransfer = async (options: {
    animal: string
    comments?: string,
    donor?: string,
    embryo_type?: string,
    timestamp?: Date|string
  })=> {
    return request({
      endpoint: 'store-reproduction',
      method: 'post',
      params: { farm: this.farm, animal: options.animal },
      auth: this.token,
      body: {
        comment: options.comments,
        donor: options.donor,
        embryo_type: options.embryo_type,
        event_code: 'reproduction.embryo_transfer',
        timestamp: getRequestFormatedTimestamp(options.timestamp || new Date),
        inseminator_id: null,
        semen: {
          bull_semen_id: null,
        }
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }

  storeNaturalBreeding = async (options: {
    animal: string
    comments?: string,
    timestamp?: Date|string
  })=> {
    return request({
      endpoint: 'store-reproduction',
      method: 'post',
      params: { farm: this.farm, animal: options.animal },
      auth: this.token,
      body: {
        comment: options.comments,
        event_code: 'reproduction.natural_breeding',
        timestamp: getRequestFormatedTimestamp(options.timestamp || new Date),
        semen: {
          bull_semen_id: null,
        }
      }
    }).then(res => ({
      data: res.data
    })).catch(e => {
      return {
        status: 'Error',
        message: e.response.data.error.message,
        details: e.response.data.error.details
      }
    })
  }

  listAnimalsInHeat = async (options: {
    page?: number
    per_page?: number
  }) => {
    return request({
      endpoint: 'list-heats',
      params: { farm: this.farm },
      query: {
        per_page: options.per_page || 10,
        page: options.page || 1
      },
      auth: this.token
    }).then(res => ({
      instructions: [
        'When displaying service recommendation or heat timestamp you should only and always display the date and hour, without minutes or seconds.',
        `The time now is ${(new Date).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          timeZoneName: 'short'
        })}. Take it in consideration when displaying recommendations.`,
        'Do not show recommendations to the past'
      ],
      meta: {
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
        total_animals_in_heat: res.data.meta.total
      },
      data: res.data.data
        // .filter((batch:any) => batch.type !== 'no-batch')
        .map((entry: any) => {

          const {
            from: conventional_from_date,
            until: conventional_until_date
          } = (this.datesFromRecommendation(
            entry['recommended_ai_period']?.conventional || null,
            new Date(entry['timestamp'])
          ) || {})

          const conventional_recommendation =
            this.reduceServiceRecommendation(conventional_from_date, conventional_until_date)


          const {
            from: sexed_from_date,
            until: sexed_until_date
          } = (this.datesFromRecommendation(
            entry['recommended_ai_period']?.sexed || null,
            new Date(entry['timestamp'])
          ) || {})

          const sexed_recommendation =
            this.reduceServiceRecommendation(sexed_from_date, sexed_until_date)

          return {
            heat_id: entry['slug'],
            heat_strength: entry['heat_strength'],
            heat_timestamp: entry['timestamp'],
            heat_confirmed_by_human: entry['confirmed_as'],
            expired: this.dateIsPast(this.getLatestRecommendationDate(
              conventional_until_date, sexed_until_date
            )),

            recommended_service_period: {
              sexed_semen: {
                expired: this.dateIsPast(sexed_until_date),
                ...sexed_recommendation
              },
              conventional_semen: {
                expired: this.dateIsPast(conventional_until_date),
                ...conventional_recommendation
              },
            },
            animal: {
              name: entry['animal.name'],
              slug: entry['animal.slug'],
              earring: entry['animal.earring'],
              thermal_challenge_for_reproduction: entry['animal.dtr'],
              post_partum_index: entry['animal.ppi_status'],
              days_in_milking: entry['animal.dim'],
              reproduction_status: entry['animal.reproduction_status'],
              health_status: entry['animal.health_status'],
              services_since_last_conception: entry['animal.reproduction_methods_since_last_conception'],
              days_since_last_insemination: entry['animal.days_since_last_insemination'],
              is_inapt: entry['animal.inapt.reason'] !== null,
              inapt_reason: entry['animal.inapt.reason'],
              inapt_since: entry['animal.inapt.from'],
              inapt_until: entry['animal.inapt.expected_return']
            },
            batch: {
              name: entry['animal.batch.name'],
              slug: entry['animal.batch.slug']
            }
          }
        })
    }))
  }


}
