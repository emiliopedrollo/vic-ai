import { request } from '#/endpoints'


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

    const offset = date.getTimezoneOffset();
    const absoluteOffset = Math.abs(offset);
    const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
    const minutes = String(absoluteOffset % 60).padStart(2, '0');
    const sign = offset <= 0 ? '+' : '-';
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

  protected reduceServiceRecommendation = (recommendation: null|{ hour: number, recommended: boolean }[], timestamp: Date) => {

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
      from: from_date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        timeZoneName: 'short'
      }),
      until: until_date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        timeZoneName: 'short'
      }),
    }
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
        "When displaying service recommendation or heat timestamp you should only display the date and hour, without minutes or seconds."
      ],
      meta: {
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
        total_animals_in_heat: res.data.meta.total
      },
      data: res.data.data
        // .filter((batch:any) => batch.type !== 'no-batch')
        .map((entry: any) => ({
            heat_strength: entry['heat_strength'],
            heat_timestamp: entry['timestamp'],
            heat_confirmed_by_human: entry['confirmed_as'],
            recommended_service_period: {
              sexed_semen: this.reduceServiceRecommendation(
                entry['recommended_ai_period']?.sexed || null,
                new Date(entry['timestamp'])
              ),
              conventional_semen: this.reduceServiceRecommendation(
                entry['recommended_ai_period']?.conventional || null,
                new Date(entry['timestamp'])
              ),
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
          })
        )
    }))
  }


}
