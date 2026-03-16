use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("CreDitEnGinE111111111111111111111111111111");

#[program]
pub mod credit_engine {
    use super::*;

    pub fn issue_credit_line(ctx: Context<IssueCreditLine>, collateral_amount: u64) -> Result<()> {
        let credit_state = &mut ctx.accounts.credit_state;
        credit_state.user = ctx.accounts.user.key();
        credit_state.credit_limit = (collateral_amount * 90) / 100; // 90% LTV
        credit_state.amount_drawn = 0;
        credit_state.created_at = Clock::get()?.unix_timestamp;

        emit!(CreditIssued {
            user: credit_state.user,
            limit: credit_state.credit_limit,
        });

        Ok(())
    }

    pub fn draw_credit(ctx: Context<DrawCredit>, amount: u64) -> Result<()> {
        let credit_state = &mut ctx.accounts.credit_state;
        require!(
            amount <= (credit_state.credit_limit - credit_state.amount_drawn),
            CreditError::LimitExceeded
        );

        // Transfer USDC from protocol treasury to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_usdc.to_account_info(),
            to: ctx.accounts.user_usdc.to_account_info(),
            authority: ctx.accounts.treasury_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        credit_state.amount_drawn += amount;

        emit!(CreditDrawn {
            user: credit_state.user,
            amount,
        });

        Ok(())
    }

    pub fn repay_credit(ctx: Context<RepayCredit>, amount: u64) -> Result<()> {
        let credit_state = &mut ctx.accounts.credit_state;

        // Transfer USDC from user back to treasury
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_usdc.to_account_info(),
            to: ctx.accounts.treasury_usdc.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        credit_state.amount_drawn = credit_state.amount_drawn.saturating_sub(amount);

        emit!(CreditRepaid {
            user: credit_state.user,
            amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct IssueCreditLine<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8 + 8,
        seeds = [b"credit", user.key().as_ref()],
        bump
    )]
    pub credit_state: Account<'info, CreditState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DrawCredit<'info> {
    #[account(mut, has_one = user)]
    pub credit_state: Account<'info, CreditState>,
    pub user: Signer<'info>,
    #[account(mut)]
    pub treasury_usdc: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,
    pub treasury_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RepayCredit<'info> {
    #[account(mut, has_one = user)]
    pub credit_state: Account<'info, CreditState>,
    pub user: Signer<'info>,
    #[account(mut)]
    pub treasury_usdc: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct CreditState {
    pub user: Pubkey,
    pub credit_limit: u64,
    pub amount_drawn: u64,
    pub created_at: i64,
}

#[event]
pub struct CreditIssued {
    pub user: Pubkey,
    pub limit: u64,
}

#[event]
pub struct CreditDrawn {
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CreditRepaid {
    pub user: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum CreditError {
    #[msg("Requested amount exceeds available credit limit.")]
    LimitExceeded,
}
