use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("CoLLatEraLVauLt1111111111111111111111111111");

#[program]
pub mod collateral_vault {
    use super::*;

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64, lock_duration: i64) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.owner = ctx.accounts.user.key();
        vault_state.amount = amount;
        vault_state.timestamp = Clock::get()?.unix_timestamp;
        vault_state.lock_duration = lock_duration;
        vault_state.is_repaid = false;

        // Transfer USDC from user to vault PDA
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_usdc.to_account_info(),
            to: ctx.accounts.vault_usdc.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        emit!(CollateralDeposited {
            owner: vault_state.owner,
            amount,
            timestamp: vault_state.timestamp,
        });

        Ok(())
    }

    pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>) -> Result<()> {
        let vault_state = &ctx.accounts.vault_state;
        require!(vault_state.is_repaid, MeridianError::RepaymentNotComplete);

        let amount = ctx.accounts.vault_usdc.amount;
        let seeds = &[
            b"vault",
            vault_state.owner.as_ref(),
            &[ctx.bumps.vault_state],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_usdc.to_account_info(),
            to: ctx.accounts.user_usdc.to_account_info(),
            authority: ctx.accounts.vault_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new_with_signer(cpi_program, cpi_accounts, signer), amount)?;

        emit!(CollateralReleased {
            owner: vault_state.owner,
            amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"usdc_vault", user.key().as_ref()],
        bump
    )]
    pub vault_usdc: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub vault_state: Account<'info, VaultState>,
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct VaultState {
    pub owner: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub lock_duration: i64,
    pub is_repaid: bool,
}

#[event]
pub struct CollateralDeposited {
    pub owner: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct CollateralReleased {
    pub owner: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum MeridianError {
    #[msg("Repayment is not complete. Collateral is still locked.")]
    RepaymentNotComplete,
}
