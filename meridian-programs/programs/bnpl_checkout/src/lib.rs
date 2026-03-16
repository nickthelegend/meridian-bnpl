use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("7SDq9q5JrKZGHvaz5dcgHpzAFy5LP583BGHJuyExHPnX");

// The mUSDC mint address on Devnet
pub const MUSDC_MINT: &str = "3z3HMHkx62jfywybKKhjtLEWeTd6PMoDAW13FF5u5jZr";

#[program]
pub mod bnpl_checkout {
    use super::*;

    pub fn initiate_bnpl(ctx: Context<InitiateBNPL>, total_amount: u64, order_id: String) -> Result<()> {
        require_keys_eq!(ctx.accounts.token_mint.key(), MUSDC_MINT.parse::<Pubkey>().unwrap(), BNPLError::InvalidMint);

        let order_state = &mut ctx.accounts.order_state;
        order_state.order_id = order_id;
        order_state.owner = ctx.accounts.user.key();
        order_state.merchant = ctx.accounts.merchant_token_account.owner;
        order_state.total_amount = total_amount;
        order_state.installment_amount = total_amount / 3;
        order_state.paid_count = 0;
        order_state.created_at = Clock::get()?.unix_timestamp;

        // Pay installment 1 immediately
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.merchant_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), order_state.installment_amount)?;

        order_state.paid_count += 1;

        emit!(BNPLInitiated {
            order_id: order_state.order_id.clone(),
            merchant: order_state.merchant,
            total: total_amount,
        });

        Ok(())
    }

    pub fn pay_installment(ctx: Context<PayInstallment>) -> Result<()> {
        let order_state = &mut ctx.accounts.order_state;
        require!(order_state.paid_count < 3, BNPLError::OrderAlreadyPaid);

        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.merchant_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), order_state.installment_amount)?;

        order_state.paid_count += 1;

        emit!(InstallmentPaid {
            order_id: order_state.order_id.clone(),
            paid_count: order_state.paid_count,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(total_amount: u64, order_id: String)]
pub struct InitiateBNPL<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 8,
        seeds = [b"order", order_id.as_bytes()],
        bump
    )]
    pub order_state: Account<'info, OrderState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub merchant_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PayInstallment<'info> {
    #[account(mut, has_one = owner)]
    pub order_state: Account<'info, OrderState>,
    pub owner: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub merchant_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct OrderState {
    pub order_id: String,
    pub owner: Pubkey,
    pub merchant: Pubkey,
    pub total_amount: u64,
    pub installment_amount: u64,
    pub paid_count: u8,
    pub created_at: i64,
}

#[event]
pub struct BNPLInitiated {
    pub order_id: String,
    pub merchant: Pubkey,
    pub total: u64,
}

#[event]
pub struct InstallmentPaid {
    pub order_id: String,
    pub paid_count: u8,
}

#[error_code]
pub enum BNPLError {
    #[msg("This order has already been fully paid.")]
    OrderAlreadyPaid,
    #[msg("Invalid token mint.")]
    InvalidMint,
}
