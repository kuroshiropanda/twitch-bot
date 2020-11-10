export class onCommandEvent {
  constructor(
    public channel: string,
    public command: string,
    public args?: string[]
  ) {}
}