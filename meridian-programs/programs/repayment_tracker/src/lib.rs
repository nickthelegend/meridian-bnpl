use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("4fkfzDbGdpyRtAByZWQ4xskB6AKfpHtFwy8mTTNx7V1G");

// The mUSDC mint address on Devnet
pub const MUSDC_MINT: &str = "3z3HMHkx62jfywybKKhjtLEWeTd6PMoDAW13FF5u5jZr";

#[program]
pub mod repayment_tracker {
    use super::*;

    pub fn register_repayment_schedule(ctx: Context<RegisterSchedule>, order_id: String, total_amount: u64) -> Result<()> {
        let schedule = &mut ctx.accounts.repayment_schedule;
        schedule.order_id = order_id;
        schedule.total_amount = total_amount;
        schedule.repaid_amount = 0;
        schedule.last_payment_at = 0;
        schedule.status = 0; // Active

        Ok(())
    }

    pub fn record_repayment(ctx: Context<RecordRepayment>, amount: u64) -> Result<()> {
        require_keys_eq!(ctx.accounts.token_mint.key(), MUSDC_MINT.parse::<Pubkey>().unwrap(), TrackerError::InvalidMint);

        let schedule = &mut ctx.accounts.repayment_schedule;
        
        // CPI to transfer mUSDC
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        schedule.repaid_amount += amount;
        schedule.last_payment_at = Clock::get()?.unix_timestamp;

        if schedule.repaid_amount >= schedule.total_amount {
            schedule.status = 1; // Completed
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
        space = 8 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"schedule", order_id.as_bytes()],
        bump
    )]
    pub repayment_schedule: Account<'info, RepaymentSchedule>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordRepayment<'info> {
    #[account(mut)]
    pub repayment_schedule: Account<'info, RepaymentSchedule>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct RepaymentSchedule {
    pub order_id: String,
    pub total_amount: u64,
    pub repaid_amount: u64,
    pub last_payment_at: i64,
    pub status: u8,
}

#[error_code]
pub enum TrackerError {
    #[msg("Invalid token mint.")]
    InvalidMint,
}
