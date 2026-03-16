use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("BE8LMagbTc3Rcy6UV6NDyCSfSSygZ5k9fB1v4WPBmfwb");

// The mUSDC mint address on Devnet
pub const MUSDC_MINT: &str = "3z3HMHkx62jfywybKKhjtLEWeTd6PMoDAW13FF5u5jZr";

#[program]
pub mod collateral_vault {
    use super::*;

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64, duration: i64) -> Result<()> {
        require_keys_eq!(ctx.accounts.token_mint.key(), MUSDC_MINT.parse::<Pubkey>().unwrap(), CollateralError::InvalidMint);
        
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.owner = ctx.accounts.owner.key();
        vault_state.amount = amount;
        vault_state.locked_until = Clock::get()?.unix_timestamp + duration;
        vault_state.is_unlocked = false;

        // Transfer tokens from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.owner_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        emit!(CollateralDeposited {
            owner: vault_state.owner,
            amount,
        });

        Ok(())
    }

    pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        require!(
            Clock::get()?.unix_timestamp >= vault_state.locked_until,
            CollateralError::StillLocked
        );

        let amount = vault_state.amount;
        
        // Transfer tokens from vault back to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: vault_state.to_account_info(),
        };
        
        let owner_key = vault_state.owner.key();
        let seeds = &[
            b"vault",
            owner_key.as_ref(),
            &[ctx.bumps.vault_state],
        ];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer),
            amount
        )?;

        vault_state.is_unlocked = true;

        emit!(CollateralWithdrawn {
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
        payer = owner,
        space = 8 + 32 + 8 + 8 + 1,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = owner,
        token::mint = token_mint,
        token::authority = vault_state,
        seeds = [b"token_vault", owner.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    #[account(
        mut, 
        has_one = owner,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"token_vault", owner.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct VaultState {
    pub owner: Pubkey,
    pub amount: u64,
    pub locked_until: i64,
    pub is_unlocked: bool,
}

#[event]
pub struct CollateralDeposited {
    pub owner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CollateralWithdrawn {
    pub owner: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum CollateralError {
    #[msg("Collateral is still locked.")]
    StillLocked,
    #[msg("Invalid token mint.")]
    InvalidMint,
}
