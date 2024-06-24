import { Mutex } from 'async-mutex'
import {
  ConfirmationEntry,
  extendConfirmationEntryDetails,
  getConfirmationEntry,
  storeConfirmationEntry, updateConfirmationEntry
} from '#/dynamo'
import { uuidv4 } from 'uuidv7'

export class Context {

  public confirmation?: string
  protected readonly mutex: Mutex;

  constructor(
    protected readonly user_id: string,
    public input_metadata: Record<string, string>,
    public output_metadata: Record<string, string>,
  ) {
    this.mutex = new Mutex
  }

  public getResponseMetadata = () => {
    return JSON.parse(JSON.stringify({
      ...this.output_metadata,
      confirmation: this.confirmation
    }))
  }

  public getMutex = () => {
    return this.mutex
  }

  public createOrExtendConfirmation = async (type: string, details: object) => {
    return await this.mutex.runExclusive(async () => {
      return this.confirmation = this.confirmation
        ? await this.updateConfirmationEntry(this.confirmation, type, details)
        : await this.createConfirmationEntry(type, details)
    })
  }

  public getConfirmationEntry = async (id: string): Promise<ConfirmationEntry> => {
    return getConfirmationEntry(id, this.user_id)
  }
  public createConfirmationEntry = async (type: string, details: object): Promise<string> => {
    const id = uuidv4()
    return storeConfirmationEntry({
      id, user_id: this.user_id, details: { [type]: [details] }, status: "pending"
    }).then(() => {
      return id
    })
  }
  public updateConfirmationEntry = async (id: string, type: string, details: object): Promise<string> => {
    return extendConfirmationEntryDetails(
      id, this.user_id, {[type]: [details]}
    ).then(() => {
      return id
    })
  }

  public processConfirmation = (confirmation?: string, latest_message?: boolean) => {
    if (confirmation) {
      if (latest_message) {

        if (confirmation === this.input_metadata?.confirm) {
          return updateConfirmationEntry(this.input_metadata.confirm, this.user_id, { status: "confirmed" })
        } else if ((confirmation === this.input_metadata?.reject)) {
          return updateConfirmationEntry(this.input_metadata.reject, this.user_id, { status: "rejected" })
        } else {
          return updateConfirmationEntry(confirmation, this.user_id, { status: "canceled" })
        }

      } else {
        return updateConfirmationEntry(confirmation, this.user_id, { status: "canceled" })
      }
    }
  }

}
