use anchor_lang::prelude::*;

declare_id!("4fkfzDbGdpyRtAByZWQ4xskB6AKfpHtFwy8mTTNx7V1G");

#[program]
pub mod repayment_tracker {
    use super::*;

    pub fn register_repayment_schedule(ctx: Context<RegisterSchedule>, order_id: String, total_amount: u64) -> Result<()> {
        let schedule = &mut ctx.accounts.repayment_schedule;
        schedule.order_id = order_id;
        schedule.total_amount = total_amount;
        schedule.installment_amount = total_amount / 3;
        
        let now = Clock::get()?.unix_timestamp;
        schedule.due_dates = [
            now, // Immediate
            now + 30 * 24 * 60 * 60,
            now + 60 * 24 * 60 * 60,
        ];
        schedule.status = [true, false, false]; // First one paid immediately in checkout

        emit!(ScheduleCreated {
            order_id: schedule.order_id.clone(),
            total: total_amount,
        });

        Ok(())
    }

    pub fn mark_installment_paid(ctx: Context<UpdateRepayment>, installment_index: u8) -> Result<()> {
        let schedule = &mut ctx.accounts.repayment_schedule;
        require!(installment_index < 3, TrackerError::InvalidIndex);
        
        schedule.status[installment_index as usize] = true;

        if schedule.status.iter().all(|&paid| paid) {
            emit!(RepaymentComplete {
                order_id: schedule.order_id.clone(),
            });
        }

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(order_id: String)]
pub struct RegisterSchedule<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8 + (8 * 3) + (1 * 3),
        seeds = [b"repayment", order_id.as_bytes()],
        bump
    )]
    pub repayment_schedule: Account<'info, RepaymentSchedule>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRepayment<'info> {
    #[account(mut)]
    pub repayment_schedule: Account<'info, RepaymentSchedule>,
    pub authority: Signer<'info>,
}

#[account]
pub struct RepaymentSchedule {
    pub order_id: String,
    pub total_amount: u64,
    pub installment_amount: u64,
    pub due_dates: [i64; 3],
    pub status: [bool; 3],
}

#[event]
pub struct ScheduleCreated {
    pub order_id: String,
    pub total: u64,
}

#[event]
pub struct RepaymentComplete {
    pub order_id: String,
}

#[error_code]
pub enum TrackerError {
    #[msg("Invalid installment index.")]
    InvalidIndex,
}
