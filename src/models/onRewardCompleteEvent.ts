import { HelixCustomRewardRedemptionTargetStatus } from 'twitch/lib'

export class onRewardCompleteEvent {
  constructor(
    public channelId: string,
    public rewardId: string,
    public redemptionId: string,
    public complete: HelixCustomRewardRedemptionTargetStatus
  ) {}
}