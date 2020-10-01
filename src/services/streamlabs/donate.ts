export interface donateData {
  type: string
  message: [
    {
      id: number,
      name: string,
      amount: string,
      formatted_amount: string,
      formattedAmount: string,
      message: string,
      currency: string,
      emotes: null,
      iconClassName: string,
      to: {
        name: string
      },
      from: string,
      from_user_id: null,
      _id: string
    }
  ]
  event_id: string
}