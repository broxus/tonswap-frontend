/* eslint-disable max-classes-per-file */
export class DexAbi {

    static Root = {
        'ABI version': 2,
        header: ['pubkey', 'time', 'expire'],
        functions: [
            {
                name: 'constructor',
                inputs: [
                    { name: 'initial_owner', type: 'address' },
                    { name: 'initial_vault', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'installPlatformOnce',
                inputs: [
                    { name: 'code', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'installOrUpdateAccountCode',
                inputs: [
                    { name: 'code', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'installOrUpdatePairCode',
                inputs: [
                    { name: 'code', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'getAccountVersion',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'uint32' },
                ],
            },
            {
                name: 'getPairVersion',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'uint32' },
                ],
            },
            {
                name: 'setVaultOnce',
                inputs: [
                    { name: 'new_vault', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'getVault',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'setActive',
                inputs: [
                    { name: 'new_active', type: 'bool' },
                ],
                outputs: [
                ],
            },
            {
                name: 'isActive',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'bool' },
                ],
            },
            {
                name: 'upgrade',
                inputs: [
                    { name: 'code', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'requestUpgradeAccount',
                inputs: [
                    { name: 'current_version', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'account_owner', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'forceUpgradeAccount',
                inputs: [
                    { name: 'account_owner', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'upgradePair',
                inputs: [
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'resetGas',
                inputs: [
                    { name: 'receiver', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'resetTargetGas',
                inputs: [
                    { name: 'target', type: 'address' },
                    { name: 'receiver', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'getOwner',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'dex_owner', type: 'address' },
                ],
            },
            {
                name: 'getPendingOwner',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'dex_pending_owner', type: 'address' },
                ],
            },
            {
                name: 'transferOwner',
                inputs: [
                    { name: 'new_owner', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'acceptOwner',
                inputs: [
                ],
                outputs: [
                ],
            },
            {
                name: 'getExpectedAccountAddress',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                    { name: 'account_owner', type: 'address' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'getExpectedPairAddress',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'deployAccount',
                inputs: [
                    { name: 'account_owner', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'deployPair',
                inputs: [
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'onPairCreated',
                inputs: [
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'platform_code',
                inputs: [
                ],
                outputs: [
                    { name: 'platform_code', type: 'cell' },
                ],
            },
            {
                name: 'account_code',
                inputs: [
                ],
                outputs: [
                    { name: 'account_code', type: 'cell' },
                ],
            },
            {
                name: 'pair_code',
                inputs: [
                ],
                outputs: [
                    { name: 'pair_code', type: 'cell' },
                ],
            },
        ],
        data: [
            { key: 1, name: '_nonce', type: 'uint32' },
        ],
        events: [
            {
                name: 'AccountCodeUpgraded',
                inputs: [
                    { name: 'version', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'PairCodeUpgraded',
                inputs: [
                    { name: 'version', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'RootCodeUpgraded',
                inputs: [
                ],
                outputs: [
                ],
            },
            {
                name: 'ActiveUpdated',
                inputs: [
                    { name: 'new_active', type: 'bool' },
                ],
                outputs: [
                ],
            },
            {
                name: 'RequestedPairUpgrade',
                inputs: [
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'RequestedForceAccountUpgrade',
                inputs: [
                    { name: 'account_owner', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'RequestedOwnerTransfer',
                inputs: [
                    { name: 'old_owner', type: 'address' },
                    { name: 'new_owner', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'OwnerTransferAccepted',
                inputs: [
                    { name: 'old_owner', type: 'address' },
                    { name: 'new_owner', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'NewPairCreated',
                inputs: [
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                ],
                outputs: [
                ],
            },
        ],
    } as const;

    static Pair = {
        'ABI version': 2,
        header: ['pubkey', 'time', 'expire'],
        functions: [
            {
                name: 'constructor',
                inputs: [
                ],
                outputs: [
                ],
            },
            {
                name: 'resetGas',
                inputs: [
                    { name: 'receiver', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'getRoot',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'dex_root', type: 'address' },
                ],
            },
            {
                name: 'getTokenRoots',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'left', type: 'address' },
                    { name: 'right', type: 'address' },
                    { name: 'lp', type: 'address' },
                ],
            },
            {
                name: 'getTokenWallets',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'left', type: 'address' },
                    { name: 'right', type: 'address' },
                    { name: 'lp', type: 'address' },
                ],
            },
            {
                name: 'getVersion',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'version', type: 'uint32' },
                ],
            },
            {
                name: 'getVault',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'dex_vault', type: 'address' },
                ],
            },
            {
                name: 'getVaultWallets',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'left', type: 'address' },
                    { name: 'right', type: 'address' },
                ],
            },
            {
                name: 'setFeeParams',
                inputs: [
                    { name: 'numerator', type: 'uint16' },
                    { name: 'denominator', type: 'uint16' },
                ],
                outputs: [
                ],
            },
            {
                name: 'getFeeParams',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'numerator', type: 'uint16' },
                    { name: 'denominator', type: 'uint16' },
                ],
            },
            {
                name: 'isActive',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'bool' },
                ],
            },
            {
                name: 'getBalances',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { components: [{ name: 'lp_supply', type: 'uint128' }, { name: 'left_balance', type: 'uint128' }, { name: 'right_balance', type: 'uint128' }], name: 'value0', type: 'tuple' },
                ],
            },
            {
                name: 'buildExchangePayload',
                inputs: [
                    { name: 'id', type: 'uint64' },
                    { name: 'deploy_wallet_grams', type: 'uint128' },
                    { name: 'expected_amount', type: 'uint128' },
                ],
                outputs: [
                    { name: 'value0', type: 'cell' },
                ],
            },
            {
                name: 'buildDepositLiquidityPayload',
                inputs: [
                    { name: 'id', type: 'uint64' },
                    { name: 'deploy_wallet_grams', type: 'uint128' },
                ],
                outputs: [
                    { name: 'value0', type: 'cell' },
                ],
            },
            {
                name: 'buildWithdrawLiquidityPayload',
                inputs: [
                    { name: 'id', type: 'uint64' },
                    { name: 'deploy_wallet_grams', type: 'uint128' },
                ],
                outputs: [
                    { name: 'value0', type: 'cell' },
                ],
            },
            {
                name: 'buildCrossPairExchangePayload',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                    { name: 'id', type: 'uint64' },
                    { name: 'deploy_wallet_grams', type: 'uint128' },
                    { name: 'expected_amount', type: 'uint128' },
                    { components: [{ name: 'amount', type: 'uint128' }, { name: 'root', type: 'address' }], name: 'steps', type: 'tuple[]' },
                ],
                outputs: [
                    { name: 'value0', type: 'cell' },
                ],
            },
            {
                name: 'tokensReceivedCallback',
                inputs: [
                    { name: 'token_wallet', type: 'address' },
                    { name: 'token_root', type: 'address' },
                    { name: 'tokens_amount', type: 'uint128' },
                    { name: 'sender_public_key', type: 'uint256' },
                    { name: 'sender_address', type: 'address' },
                    { name: 'sender_wallet', type: 'address' },
                    { name: 'original_gas_to', type: 'address' },
                    { name: 'value7', type: 'uint128' },
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'expectedDepositLiquidity',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                    { name: 'left_amount', type: 'uint128' },
                    { name: 'right_amount', type: 'uint128' },
                    { name: 'auto_change', type: 'bool' },
                ],
                outputs: [
                    { components: [{ name: 'step_1_left_deposit', type: 'uint128' }, { name: 'step_1_right_deposit', type: 'uint128' }, { name: 'step_1_lp_reward', type: 'uint128' }, { name: 'step_2_left_to_right', type: 'bool' }, { name: 'step_2_right_to_left', type: 'bool' }, { name: 'step_2_spent', type: 'uint128' }, { name: 'step_2_fee', type: 'uint128' }, { name: 'step_2_received', type: 'uint128' }, { name: 'step_3_left_deposit', type: 'uint128' }, { name: 'step_3_right_deposit', type: 'uint128' }, { name: 'step_3_lp_reward', type: 'uint128' }], name: 'value0', type: 'tuple' },
                ],
            },
            {
                name: 'depositLiquidity',
                inputs: [
                    { name: 'call_id', type: 'uint64' },
                    { name: 'left_amount', type: 'uint128' },
                    { name: 'right_amount', type: 'uint128' },
                    { name: 'expected_lp_root', type: 'address' },
                    { name: 'auto_change', type: 'bool' },
                    { name: 'account_owner', type: 'address' },
                    { name: 'value6', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'expectedWithdrawLiquidity',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                    { name: 'lp_amount', type: 'uint128' },
                ],
                outputs: [
                    { name: 'expected_left_amount', type: 'uint128' },
                    { name: 'expected_right_amount', type: 'uint128' },
                ],
            },
            {
                name: 'withdrawLiquidity',
                inputs: [
                    { name: 'call_id', type: 'uint64' },
                    { name: 'lp_amount', type: 'uint128' },
                    { name: 'expected_lp_root', type: 'address' },
                    { name: 'account_owner', type: 'address' },
                    { name: 'value4', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'expectedExchange',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                    { name: 'amount', type: 'uint128' },
                    { name: 'spent_token_root', type: 'address' },
                ],
                outputs: [
                    { name: 'expected_amount', type: 'uint128' },
                    { name: 'expected_fee', type: 'uint128' },
                ],
            },
            {
                name: 'expectedSpendAmount',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                    { name: 'receive_amount', type: 'uint128' },
                    { name: 'receive_token_root', type: 'address' },
                ],
                outputs: [
                    { name: 'expected_amount', type: 'uint128' },
                    { name: 'expected_fee', type: 'uint128' },
                ],
            },
            {
                name: 'exchange',
                inputs: [
                    { name: 'call_id', type: 'uint64' },
                    { name: 'spent_amount', type: 'uint128' },
                    { name: 'spent_token_root', type: 'address' },
                    { name: 'receive_token_root', type: 'address' },
                    { name: 'expected_amount', type: 'uint128' },
                    { name: 'account_owner', type: 'address' },
                    { name: 'value6', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'crossPairExchange',
                inputs: [
                    { name: 'id', type: 'uint64' },
                    { name: 'value1', type: 'uint32' },
                    { name: 'prev_pair_left_root', type: 'address' },
                    { name: 'prev_pair_right_root', type: 'address' },
                    { name: 'spent_token_root', type: 'address' },
                    { name: 'spent_amount', type: 'uint128' },
                    { name: 'sender_public_key', type: 'uint256' },
                    { name: 'sender_address', type: 'address' },
                    { name: 'original_gas_to', type: 'address' },
                    { name: 'deploy_wallet_grams', type: 'uint128' },
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'checkPair',
                inputs: [
                    { name: 'call_id', type: 'uint64' },
                    { name: 'account_owner', type: 'address' },
                    { name: 'value2', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'upgrade',
                inputs: [
                    { name: 'code', type: 'cell' },
                    { name: 'new_version', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'afterInitialize',
                inputs: [
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'liquidityTokenRootDeployed',
                inputs: [
                    { name: 'lp_root_', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'liquidityTokenRootNotDeployed',
                inputs: [
                    { name: 'value0', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'expectedWalletAddressCallback',
                inputs: [
                    { name: 'wallet', type: 'address' },
                    { name: 'wallet_public_key', type: 'uint256' },
                    { name: 'owner_address', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'platform_code',
                inputs: [
                ],
                outputs: [
                    { name: 'platform_code', type: 'cell' },
                ],
            },
            {
                name: 'lp_wallet',
                inputs: [
                ],
                outputs: [
                    { name: 'lp_wallet', type: 'address' },
                ],
            },
            {
                name: 'left_wallet',
                inputs: [
                ],
                outputs: [
                    { name: 'left_wallet', type: 'address' },
                ],
            },
            {
                name: 'right_wallet',
                inputs: [
                ],
                outputs: [
                    { name: 'right_wallet', type: 'address' },
                ],
            },
            {
                name: 'vault_left_wallet',
                inputs: [
                ],
                outputs: [
                    { name: 'vault_left_wallet', type: 'address' },
                ],
            },
            {
                name: 'vault_right_wallet',
                inputs: [
                ],
                outputs: [
                    { name: 'vault_right_wallet', type: 'address' },
                ],
            },
            {
                name: 'lp_root',
                inputs: [
                ],
                outputs: [
                    { name: 'lp_root', type: 'address' },
                ],
            },
            {
                name: 'lp_supply',
                inputs: [
                ],
                outputs: [
                    { name: 'lp_supply', type: 'uint128' },
                ],
            },
            {
                name: 'left_balance',
                inputs: [
                ],
                outputs: [
                    { name: 'left_balance', type: 'uint128' },
                ],
            },
            {
                name: 'right_balance',
                inputs: [
                ],
                outputs: [
                    { name: 'right_balance', type: 'uint128' },
                ],
            },
        ],
        data: [
        ],
        events: [
            {
                name: 'PairCodeUpgraded',
                inputs: [
                    { name: 'version', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'FeesParamsUpdated',
                inputs: [
                    { name: 'numerator', type: 'uint16' },
                    { name: 'denominator', type: 'uint16' },
                ],
                outputs: [
                ],
            },
            {
                name: 'DepositLiquidity',
                inputs: [
                    { name: 'left', type: 'uint128' },
                    { name: 'right', type: 'uint128' },
                    { name: 'lp', type: 'uint128' },
                ],
                outputs: [
                ],
            },
            {
                name: 'WithdrawLiquidity',
                inputs: [
                    { name: 'lp', type: 'uint128' },
                    { name: 'left', type: 'uint128' },
                    { name: 'right', type: 'uint128' },
                ],
                outputs: [
                ],
            },
            {
                name: 'ExchangeLeftToRight',
                inputs: [
                    { name: 'left', type: 'uint128' },
                    { name: 'fee', type: 'uint128' },
                    { name: 'right', type: 'uint128' },
                ],
                outputs: [
                ],
            },
            {
                name: 'ExchangeRightToLeft',
                inputs: [
                    { name: 'right', type: 'uint128' },
                    { name: 'fee', type: 'uint128' },
                    { name: 'left', type: 'uint128' },
                ],
                outputs: [
                ],
            },
        ],
    } as const;

    static Account = {
        'ABI version': 2,
        header: ['pubkey', 'time', 'expire'],
        functions: [
            {
                name: 'constructor',
                inputs: [
                ],
                outputs: [
                ],
            },
            {
                name: 'resetGas',
                inputs: [
                    { name: 'receiver', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'getRoot',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'getOwner',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'getVersion',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'uint32' },
                ],
            },
            {
                name: 'getVault',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'getWalletData',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                    { name: 'token_root', type: 'address' },
                ],
                outputs: [
                    { name: 'wallet', type: 'address' },
                    { name: 'balance', type: 'uint128' },
                ],
            },
            {
                name: 'getWallets',
                inputs: [
                ],
                outputs: [
                    { name: 'value0', type: 'map(address,address)' },
                ],
            },
            {
                name: 'getBalances',
                inputs: [
                ],
                outputs: [
                    { name: 'value0', type: 'map(address,uint128)' },
                ],
            },
            {
                name: 'getNonce',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'uint64' },
                ],
            },
            {
                name: 'tokensReceivedCallback',
                inputs: [
                    { name: 'token_wallet', type: 'address' },
                    { name: 'token_root', type: 'address' },
                    { name: 'tokens_amount', type: 'uint128' },
                    { name: 'value3', type: 'uint256' },
                    { name: 'value4', type: 'address' },
                    { name: 'sender_wallet', type: 'address' },
                    { name: 'original_gas_to', type: 'address' },
                    { name: 'value7', type: 'uint128' },
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'withdraw',
                inputs: [
                    { name: 'amount', type: 'uint128' },
                    { name: 'token_root', type: 'address' },
                    { name: 'recipient_public_key', type: 'uint256' },
                    { name: 'recipient_address', type: 'address' },
                    { name: 'deploy_wallet_grams', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'transfer',
                inputs: [
                    { name: 'amount', type: 'uint128' },
                    { name: 'token_root', type: 'address' },
                    { name: 'to_dex_account', type: 'address' },
                    { name: 'willing_to_deploy', type: 'bool' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'internalAccountTransfer',
                inputs: [
                    { name: 'call_id', type: 'uint64' },
                    { name: 'amount', type: 'uint128' },
                    { name: 'token_root', type: 'address' },
                    { name: 'sender_owner', type: 'address' },
                    { name: 'willing_to_deploy', type: 'bool' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'internalPairTransfer',
                inputs: [
                    { name: 'amount', type: 'uint128' },
                    { name: 'token_root', type: 'address' },
                    { name: 'sender_left_root', type: 'address' },
                    { name: 'sender_right_root', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'exchange',
                inputs: [
                    { name: 'spent_amount', type: 'uint128' },
                    { name: 'spent_token_root', type: 'address' },
                    { name: 'receive_token_root', type: 'address' },
                    { name: 'expected_amount', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'depositLiquidity',
                inputs: [
                    { name: 'left_root', type: 'address' },
                    { name: 'left_amount', type: 'uint128' },
                    { name: 'right_root', type: 'address' },
                    { name: 'right_amount', type: 'uint128' },
                    { name: 'expected_lp_root', type: 'address' },
                    { name: 'auto_change', type: 'bool' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'withdrawLiquidity',
                inputs: [
                    { name: 'lp_amount', type: 'uint128' },
                    { name: 'lp_root', type: 'address' },
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'addPair',
                inputs: [
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'checkPairCallback',
                inputs: [
                    { name: 'original_call_id', type: 'uint64' },
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                    { name: 'lp_root', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'expectedWalletAddressCallback',
                inputs: [
                    { name: 'wallet', type: 'address' },
                    { name: 'wallet_public_key', type: 'uint256' },
                    { name: 'owner_address', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'requestUpgrade',
                inputs: [
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'upgrade',
                inputs: [
                    { name: 'code', type: 'cell' },
                    { name: 'new_version', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'successCallback',
                inputs: [
                    { name: 'call_id', type: 'uint64' },
                ],
                outputs: [
                ],
            },
            {
                name: 'gc',
                inputs: [
                ],
                outputs: [
                ],
            },
            {
                name: 'platform_code',
                inputs: [
                ],
                outputs: [
                    { name: 'platform_code', type: 'cell' },
                ],
            },
        ],
        data: [
        ],
        events: [
            {
                name: 'AddPair',
                inputs: [
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                    { name: 'pair', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'WithdrawTokens',
                inputs: [
                    { name: 'root', type: 'address' },
                    { name: 'amount', type: 'uint128' },
                    { name: 'balance', type: 'uint128' },
                ],
                outputs: [
                ],
            },
            {
                name: 'TransferTokens',
                inputs: [
                    { name: 'root', type: 'address' },
                    { name: 'amount', type: 'uint128' },
                    { name: 'balance', type: 'uint128' },
                ],
                outputs: [
                ],
            },
            {
                name: 'ExchangeTokens',
                inputs: [
                    { name: 'from', type: 'address' },
                    { name: 'to', type: 'address' },
                    { name: 'spent_amount', type: 'uint128' },
                    { name: 'expected_amount', type: 'uint128' },
                    { name: 'balance', type: 'uint128' },
                ],
                outputs: [
                ],
            },
            {
                name: 'DepositLiquidity',
                inputs: [
                    { name: 'left_root', type: 'address' },
                    { name: 'left_amount', type: 'uint128' },
                    { name: 'right_root', type: 'address' },
                    { name: 'right_amount', type: 'uint128' },
                    { name: 'auto_change', type: 'bool' },
                ],
                outputs: [
                ],
            },
            {
                name: 'WithdrawLiquidity',
                inputs: [
                    { name: 'lp_amount', type: 'uint128' },
                    { name: 'lp_balance', type: 'uint128' },
                    { name: 'lp_root', type: 'address' },
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'TokensReceived',
                inputs: [
                    { name: 'token_root', type: 'address' },
                    { name: 'tokens_amount', type: 'uint128' },
                    { name: 'balance', type: 'uint128' },
                    { name: 'sender_wallet', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'TokensReceivedFromAccount',
                inputs: [
                    { name: 'token_root', type: 'address' },
                    { name: 'tokens_amount', type: 'uint128' },
                    { name: 'balance', type: 'uint128' },
                    { name: 'sender', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'TokensReceivedFromPair',
                inputs: [
                    { name: 'token_root', type: 'address' },
                    { name: 'tokens_amount', type: 'uint128' },
                    { name: 'balance', type: 'uint128' },
                    { name: 'left_root', type: 'address' },
                    { name: 'right_root', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'OperationRollback',
                inputs: [
                    { name: 'token_root', type: 'address' },
                    { name: 'amount', type: 'uint128' },
                    { name: 'balance', type: 'uint128' },
                    { name: 'from', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'ExpectedPairNotExist',
                inputs: [
                    { name: 'pair', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'AccountCodeUpgraded',
                inputs: [
                    { name: 'version', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'CodeUpgradeRequested',
                inputs: [
                ],
                outputs: [
                ],
            },
            {
                name: 'GarbageCollected',
                inputs: [
                ],
                outputs: [
                ],
            },
        ],
    } as const;

    static Callbacks = {
        'ABI version': 2,
        header: ['time'],
        functions: [
            {
                name: 'dexAccountOnSuccess',
                inputs: [{ name: 'nonce', type: 'uint64' }],
                outputs: [],
            },
            {
                name: 'dexAccountOnBounce',
                inputs: [
                    { name: 'nonce', type: 'uint64' },
                    { name: 'functionId', type: 'uint32' },
                ],
                outputs: [],
            },
            {
                name: 'dexPairDepositLiquiditySuccess',
                inputs: [
                    { name: 'id', type: 'uint64' },
                    { name: 'via_account', type: 'bool' },
                    {
                        name: 'result',
                        components: [
                            { name: 'step_1_left_deposit', type: 'uint128' },
                            { name: 'step_1_right_deposit', type: 'uint128' },
                            { name: 'step_1_lp_reward', type: 'uint128' },
                            { name: 'step_2_left_to_right', type: 'bool' },
                            { name: 'step_2_right_to_left', type: 'bool' },
                            { name: 'step_2_spent', type: 'uint128' },
                            { name: 'step_2_fee', type: 'uint128' },
                            { name: 'step_2_received', type: 'uint128' },
                            { name: 'step_3_left_deposit', type: 'uint128' },
                            { name: 'step_3_right_deposit', type: 'uint128' },
                            { name: 'step_3_lp_reward', type: 'uint128' },
                        ],
                        type: 'tuple',
                    },
                ],
                outputs: [],
            },
            {
                name: 'dexPairExchangeSuccess',
                inputs: [
                    { name: 'id', type: 'uint64' },
                    { name: 'via_account', type: 'bool' },
                    {
                        name: 'result',
                        components: [
                            { name: 'left_to_right', type: 'bool' },
                            { name: 'spent', type: 'uint128' },
                            { name: 'fee', type: 'uint128' },
                            { name: 'received', type: 'uint128' },
                        ],
                        type: 'tuple',
                    },
                ],
                outputs: [],
            },
            {
                name: 'dexPairWithdrawSuccess',
                inputs: [
                    { name: 'id', type: 'uint64' },
                    { name: 'via_account', type: 'bool' },
                    {
                        name: 'result',
                        components: [
                            { name: 'lp', type: 'uint128' },
                            { name: 'left', type: 'uint128' },
                            { name: 'right', type: 'uint128' },
                        ],
                        type: 'tuple',
                    },
                ],
                outputs: [],
            },
            {
                name: 'dexPairOperationCancelled',
                inputs: [{ name: 'id', type: 'uint64' }],
                outputs: [],
            },
        ],
        data: [],
        events: [],
    } as const;

}

export class TokenAbi {

    static Root = {
        'ABI version': 2,
        header: ['pubkey', 'time', 'expire'],
        functions: [
            {
                name: 'constructor',
                inputs: [
                    { name: 'root_public_key_', type: 'uint256' },
                    { name: 'root_owner_address_', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'getVersion',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'uint32' },
                ],
            },
            {
                name: 'getDetails',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    {
                        components: [
                            { name: 'name', type: 'bytes' },
                            { name: 'symbol', type: 'bytes' },
                            { name: 'decimals', type: 'uint8' },
                            { name: 'root_public_key', type: 'uint256' },
                            { name: 'root_owner_address', type: 'address' },
                            { name: 'total_supply', type: 'uint128' },
                        ],
                        name: 'value0',
                        type: 'tuple',
                    },
                ],
            },
            {
                name: 'getTotalSupply',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'uint128' },
                ],
            },
            {
                name: 'getWalletCode',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'cell' },
                ],
            },
            {
                name: 'getWalletAddress',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                    { name: 'wallet_public_key_', type: 'uint256' },
                    { name: 'owner_address_', type: 'address' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'sendExpectedWalletAddress',
                inputs: [
                    { name: 'wallet_public_key_', type: 'uint256' },
                    { name: 'owner_address_', type: 'address' },
                    { name: 'to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'deployWallet',
                inputs: [
                    { name: 'tokens', type: 'uint128' },
                    { name: 'deploy_grams', type: 'uint128' },
                    { name: 'wallet_public_key_', type: 'uint256' },
                    { name: 'owner_address_', type: 'address' },
                    { name: 'gas_back_address', type: 'address' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'deployEmptyWallet',
                inputs: [
                    { name: 'deploy_grams', type: 'uint128' },
                    { name: 'wallet_public_key_', type: 'uint256' },
                    { name: 'owner_address_', type: 'address' },
                    { name: 'gas_back_address', type: 'address' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'mint',
                inputs: [
                    { name: 'tokens', type: 'uint128' },
                    { name: 'to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'proxyBurn',
                inputs: [
                    { name: 'tokens', type: 'uint128' },
                    { name: 'sender_address', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'callback_address', type: 'address' },
                    { name: 'callback_payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'tokensBurned',
                inputs: [
                    { name: 'tokens', type: 'uint128' },
                    { name: 'sender_public_key', type: 'uint256' },
                    { name: 'sender_address', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'callback_address', type: 'address' },
                    { name: 'callback_payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'sendSurplusGas',
                inputs: [
                    { name: 'to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'setPaused',
                inputs: [
                    { name: 'value', type: 'bool' },
                ],
                outputs: [
                ],
            },
            {
                name: 'sendPausedCallbackTo',
                inputs: [
                    { name: 'callback_id', type: 'uint64' },
                    { name: 'callback_addr', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'transferOwner',
                inputs: [
                    { name: 'root_public_key_', type: 'uint256' },
                    { name: 'root_owner_address_', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'name',
                inputs: [
                ],
                outputs: [
                    { name: 'name', type: 'bytes' },
                ],
            },
            {
                name: 'symbol',
                inputs: [
                ],
                outputs: [
                    { name: 'symbol', type: 'bytes' },
                ],
            },
            {
                name: 'decimals',
                inputs: [
                ],
                outputs: [
                    { name: 'decimals', type: 'uint8' },
                ],
            },
            {
                name: 'start_gas_balance',
                inputs: [
                ],
                outputs: [
                    { name: 'start_gas_balance', type: 'uint128' },
                ],
            },
            {
                name: 'paused',
                inputs: [
                ],
                outputs: [
                    { name: 'paused', type: 'bool' },
                ],
            },
        ],
        data: [
            { key: 1, name: '_randomNonce', type: 'uint256' },
            { key: 2, name: 'name', type: 'bytes' },
            { key: 3, name: 'symbol', type: 'bytes' },
            { key: 4, name: 'decimals', type: 'uint8' },
            { key: 5, name: 'wallet_code', type: 'cell' },
        ],
        events: [
        ],
    } as const;

    static Wallet = {
        'ABI version': 2,
        header: ['pubkey', 'time', 'expire'],
        functions: [
            {
                name: 'constructor',
                inputs: [
                ],
                outputs: [
                ],
            },
            {
                name: 'getVersion',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'uint32' },
                ],
            },
            {
                name: 'balance',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'uint128' },
                ],
            },
            {
                name: 'getDetails',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    {
                        components: [{ name: 'root_address', type: 'address' },
                            { name: 'wallet_public_key', type: 'uint256' },
                            { name: 'owner_address', type: 'address' },
                            { name: 'balance', type: 'uint128' },
                            { name: 'receive_callback', type: 'address' },
                            { name: 'bounced_callback', type: 'address' },
                            { name: 'allow_non_notifiable', type: 'bool' }],
                        name: 'value0',
                        type: 'tuple',
                    },
                ],
            },
            {
                name: 'getWalletCode',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'cell' },
                ],
            },
            {
                name: 'accept',
                inputs: [
                    { name: 'tokens', type: 'uint128' },
                ],
                outputs: [
                ],
            },
            {
                name: 'allowance',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    {
                        components: [{ name: 'remaining_tokens', type: 'uint128' },
                            { name: 'spender', type: 'address' }],
                        name: 'value0',
                        type: 'tuple',
                    },
                ],
            },
            {
                name: 'approve',
                inputs: [
                    { name: 'spender', type: 'address' },
                    { name: 'remaining_tokens', type: 'uint128' },
                    { name: 'tokens', type: 'uint128' },
                ],
                outputs: [
                ],
            },
            {
                name: 'disapprove',
                inputs: [
                ],
                outputs: [
                ],
            },
            {
                name: 'transferToRecipient',
                inputs: [
                    { name: 'recipient_public_key', type: 'uint256' },
                    { name: 'recipient_address', type: 'address' },
                    { name: 'tokens', type: 'uint128' },
                    { name: 'deploy_grams', type: 'uint128' },
                    { name: 'transfer_grams', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'notify_receiver', type: 'bool' },
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'transfer',
                inputs: [
                    { name: 'to', type: 'address' },
                    { name: 'tokens', type: 'uint128' },
                    { name: 'grams', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'notify_receiver', type: 'bool' },
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'transferFrom',
                inputs: [
                    { name: 'from', type: 'address' },
                    { name: 'to', type: 'address' },
                    { name: 'tokens', type: 'uint128' },
                    { name: 'grams', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'notify_receiver', type: 'bool' },
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'internalTransfer',
                inputs: [
                    { name: 'tokens', type: 'uint128' },
                    { name: 'sender_public_key', type: 'uint256' },
                    { name: 'sender_address', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'notify_receiver', type: 'bool' },
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'internalTransferFrom',
                inputs: [
                    { name: 'to', type: 'address' },
                    { name: 'tokens', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'notify_receiver', type: 'bool' },
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'burnByOwner',
                inputs: [
                    { name: 'tokens', type: 'uint128' },
                    { name: 'grams', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'callback_address', type: 'address' },
                    { name: 'callback_payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'burnByRoot',
                inputs: [
                    { name: 'tokens', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'callback_address', type: 'address' },
                    { name: 'callback_payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'setReceiveCallback',
                inputs: [
                    { name: 'receive_callback_', type: 'address' },
                    { name: 'allow_non_notifiable_', type: 'bool' },
                ],
                outputs: [
                ],
            },
            {
                name: 'setBouncedCallback',
                inputs: [
                    { name: 'bounced_callback_', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'destroy',
                inputs: [
                    { name: 'gas_dest', type: 'address' },
                ],
                outputs: [
                ],
            },
        ],
        data: [
            { key: 1, name: 'root_address', type: 'address' },
            { key: 2, name: 'code', type: 'cell' },
            { key: 3, name: 'wallet_public_key', type: 'uint256' },
            { key: 4, name: 'owner_address', type: 'address' },
        ],
        events: [
        ],
    } as const;

    static Factory = {
        'ABI version': 2,
        header: ['time'],
        functions: [
            {
                name: 'constructor',
                inputs: [
                    { name: 'storage_code_', type: 'cell' },
                    { name: 'initial_owner', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'transferOwner',
                inputs: [
                    { name: 'new_owner', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'acceptOwner',
                inputs: [
                ],
                outputs: [
                ],
            },
            {
                name: 'getOwner',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'getPendingOwner',
                inputs: [
                    { name: '_answer_id', type: 'uint32' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
            {
                name: 'setRootCode',
                inputs: [
                    { name: 'root_code_', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'setWalletCode',
                inputs: [
                    { name: 'wallet_code_', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'Token',
                inputs: [
                    { name: 'answer_id', type: 'uint32' },
                    { name: 'root_public_key', type: 'uint256' },
                    { name: 'root_owner_address', type: 'address' },
                    { name: 'name', type: 'bytes' },
                    { name: 'symbol', type: 'bytes' },
                    { name: 'decimals', type: 'uint8' },
                ],
                outputs: [
                ],
            },
            {
                name: 'onTokenGetDetails',
                inputs: [
                    { components: [{ name: 'name', type: 'bytes' }, { name: 'symbol', type: 'bytes' }, { name: 'decimals', type: 'uint8' }, { name: 'root_public_key', type: 'uint256' }, { name: 'root_owner_address', type: 'address' }, { name: 'total_supply', type: 'uint128' }], name: 'details', type: 'tuple' },
                ],
                outputs: [
                ],
            },
            {
                name: 'onStorageReadWithDetails',
                inputs: [
                    { components: [{ name: 'answer_id', type: 'uint32' }, { name: 'pending_token', type: 'address' }, { name: 'root_public_key', type: 'uint256' }, { name: 'root_owner_address', type: 'address' }, { name: 'name', type: 'bytes' }, { name: 'symbol', type: 'bytes' }, { name: 'decimals', type: 'uint8' }, { name: 'sender', type: 'address' }], name: 'data', type: 'tuple' },
                    { name: 'meta', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'onStoragePruneNotify',
                inputs: [
                    { components: [{ name: 'answer_id', type: 'uint32' }, { name: 'pending_token', type: 'address' }, { name: 'root_public_key', type: 'uint256' }, { name: 'root_owner_address', type: 'address' }, { name: 'name', type: 'bytes' }, { name: 'symbol', type: 'bytes' }, { name: 'decimals', type: 'uint8' }, { name: 'sender', type: 'address' }], name: 'data', type: 'tuple' },
                ],
                outputs: [
                ],
            },
            {
                name: 'onStoragePruneReturn',
                inputs: [
                    { components: [{ name: 'answer_id', type: 'uint32' }, { name: 'pending_token', type: 'address' }, { name: 'root_public_key', type: 'uint256' }, { name: 'root_owner_address', type: 'address' }, { name: 'name', type: 'bytes' }, { name: 'symbol', type: 'bytes' }, { name: 'decimals', type: 'uint8' }, { name: 'sender', type: 'address' }], name: 'data', type: 'tuple' },
                ],
                outputs: [
                ],
            },
            {
                name: 'upgrade',
                inputs: [
                    { name: 'code', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'resetGas',
                inputs: [
                    { name: 'receiver', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'resetTargetGas',
                inputs: [
                    { name: 'target', type: 'address' },
                    { name: 'receiver', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'root_code',
                inputs: [
                ],
                outputs: [
                    { name: 'root_code', type: 'cell' },
                ],
            },
            {
                name: 'wallet_code',
                inputs: [
                ],
                outputs: [
                    { name: 'wallet_code', type: 'cell' },
                ],
            },
            {
                name: 'storage_code',
                inputs: [
                ],
                outputs: [
                    { name: 'storage_code', type: 'cell' },
                ],
            },
            {
                name: 'owner',
                inputs: [
                ],
                outputs: [
                    { name: 'owner', type: 'address' },
                ],
            },
            {
                name: 'pending_owner',
                inputs: [
                ],
                outputs: [
                    { name: 'pending_owner', type: 'address' },
                ],
            },
        ],
        data: [
            { key: 1, name: '_nonce', type: 'uint32' },
        ],
        events: [
        ],
    } as const;

    static TokenRootDeployCallbacks = {
        'ABI version': 2,
        header: ['pubkey', 'time', 'expire'],
        functions: [
            {
                name: 'notifyTokenRootDeployed',
                inputs: [
                    { name: 'answer_id', type: 'uint32' },
                    { name: 'token_root', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'notifyTokenRootNotDeployed',
                inputs: [
                    { name: 'answer_id', type: 'uint32' },
                    { name: 'token_root', type: 'address' },
                ],
                outputs: [
                ],
            },

        ],
        data: [
        ],
        events: [
        ],
    } as const;

}

export class FarmAbi {

    static Fabric = {
        'ABI version': 2,
        version: '2.1',
        header: ['time', 'expire'],
        functions: [
            {
                name: 'constructor',
                inputs: [
                    { name: '_owner', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'deployFarmPool',
                inputs: [
                    { name: 'pool_owner', type: 'address' },
                    { components: [{ name: 'startTime', type: 'uint32' }, { name: 'rewardPerSecond', type: 'uint128[]' }], name: 'reward_rounds', type: 'tuple[]' },
                    { name: 'tokenRoot', type: 'address' },
                    { name: 'rewardTokenRoot', type: 'address[]' },
                    { name: 'vestingPeriod', type: 'uint32' },
                    { name: 'vestingRatio', type: 'uint32' },
                    { name: 'withdrawAllLockPeriod', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'onPoolDeploy',
                inputs: [
                    { name: 'pool_deploy_nonce', type: 'uint64' },
                    { name: 'pool_owner', type: 'address' },
                    { components: [{ name: 'startTime', type: 'uint32' }, { name: 'rewardPerSecond', type: 'uint128[]' }], name: 'reward_rounds', type: 'tuple[]' },
                    { name: 'tokenRoot', type: 'address' },
                    { name: 'rewardTokenRoot', type: 'address[]' },
                    { name: 'vestingPeriod', type: 'uint32' },
                    { name: 'vestingRatio', type: 'uint32' },
                    { name: 'withdrawAllLockPeriod', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'upgrade',
                inputs: [
                    { name: 'new_code', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'pools_count',
                inputs: [
                ],
                outputs: [
                    { name: 'pools_count', type: 'uint64' },
                ],
            },
            {
                name: 'owner',
                inputs: [
                ],
                outputs: [
                    { name: 'owner', type: 'address' },
                ],
            },
            {
                name: 'FarmPoolUserDataCode',
                inputs: [
                ],
                outputs: [
                    { name: 'FarmPoolUserDataCode', type: 'cell' },
                ],
            },
            {
                name: 'FarmPoolCode',
                inputs: [
                ],
                outputs: [
                    { name: 'FarmPoolCode', type: 'cell' },
                ],
            },
            {
                name: 'nonce',
                inputs: [
                ],
                outputs: [
                    { name: 'nonce', type: 'uint128' },
                ],
            },
        ],
        data: [
            { key: 1, name: 'FarmPoolUserDataCode', type: 'cell' },
            { key: 2, name: 'FarmPoolCode', type: 'cell' },
            { key: 3, name: 'nonce', type: 'uint128' },
        ],
        events: [
            {
                name: 'NewFarmPool',
                inputs: [
                    { name: 'pool', type: 'address' },
                    { name: 'pool_owner', type: 'address' },
                    { components: [{ name: 'startTime', type: 'uint32' }, { name: 'rewardPerSecond', type: 'uint128[]' }], name: 'reward_rounds', type: 'tuple[]' },
                    { name: 'tokenRoot', type: 'address' },
                    { name: 'rewardTokenRoot', type: 'address[]' },
                    { name: 'vestingPeriod', type: 'uint32' },
                    { name: 'vestingRatio', type: 'uint32' },
                    { name: 'withdrawAllLockPeriod', type: 'uint32' },
                ],
                outputs: [
                ],
            },
        ],
        fields: [
            { name: '_pubkey', type: 'uint256' },
            { name: '_timestamp', type: 'uint64' },
            { name: '_constructorFlag', type: 'bool' },
            { name: 'pools_count', type: 'uint64' },
            { name: 'owner', type: 'address' },
            { name: 'FarmPoolUserDataCode', type: 'cell' },
            { name: 'FarmPoolCode', type: 'cell' },
            { name: 'nonce', type: 'uint128' },
        ],
    } as const;

    static Pool = {
        'ABI version': 2,
        version: '2.1',
        header: ['time', 'expire'],
        functions: [
            {
                name: 'constructor',
                inputs: [
                    { name: '_owner', type: 'address' },
                    { components: [{ name: 'startTime', type: 'uint32' }, { name: 'rewardPerSecond', type: 'uint128[]' }], name: '_rewardRounds', type: 'tuple[]' },
                    { name: '_tokenRoot', type: 'address' },
                    { name: '_rewardTokenRoot', type: 'address[]' },
                    { name: '_vestingPeriod', type: 'uint32' },
                    { name: '_vestingRatio', type: 'uint32' },
                    { name: '_withdrawAllLockPeriod', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'getVersion',
                inputs: [
                ],
                outputs: [
                    { name: 'value0', type: 'uint8' },
                    { name: 'value1', type: 'uint8' },
                    { name: 'value2', type: 'uint8' },
                ],
            },
            {
                name: 'getDetails',
                inputs: [
                    { name: 'answerId', type: 'uint32' },
                ],
                outputs: [
                    { components: [{ name: 'lastRewardTime', type: 'uint32' }, { name: 'farmEndTime', type: 'uint32' }, { name: 'vestingPeriod', type: 'uint32' }, { name: 'vestingRatio', type: 'uint32' }, { name: 'tokenRoot', type: 'address' }, { name: 'tokenWallet', type: 'address' }, { name: 'tokenBalance', type: 'uint128' }, { components: [{ name: 'startTime', type: 'uint32' }, { name: 'rewardPerSecond', type: 'uint128[]' }], name: 'rewardRounds', type: 'tuple[]' }, { name: 'accTonPerShare', type: 'uint256[]' }, { name: 'rewardTokenRoot', type: 'address[]' }, { name: 'rewardTokenWallet', type: 'address[]' }, { name: 'rewardTokenBalance', type: 'uint128[]' }, { name: 'rewardTokenBalanceCumulative', type: 'uint128[]' }, { name: 'unclaimedReward', type: 'uint128[]' }, { name: 'owner', type: 'address' }, { name: 'fabric', type: 'address' }], name: 'value0', type: 'tuple' },
                ],
            },
            {
                name: 'receiveTokenWalletAddress',
                inputs: [
                    { name: 'wallet', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'encodeDepositPayload',
                inputs: [
                    { name: 'deposit_owner', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                    { name: 'deposit_payload', type: 'cell' },
                ],
            },
            {
                name: 'decodeDepositPayload',
                inputs: [
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                    { name: 'deposit_owner', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                    { name: 'correct', type: 'bool' },
                ],
            },
            {
                name: 'tokensReceivedCallback',
                inputs: [
                    { name: 'token_wallet', type: 'address' },
                    { name: 'token_root', type: 'address' },
                    { name: 'amount', type: 'uint128' },
                    { name: 'sender_public_key', type: 'uint256' },
                    { name: 'sender_address', type: 'address' },
                    { name: 'sender_wallet', type: 'address' },
                    { name: 'original_gas_to', type: 'address' },
                    { name: 'updated_balance', type: 'uint128' },
                    { name: 'payload', type: 'cell' },
                ],
                outputs: [
                ],
            },
            {
                name: 'finishDeposit',
                inputs: [
                    { name: '_deposit_nonce', type: 'uint64' },
                    { name: '_vested', type: 'uint128[]' },
                ],
                outputs: [
                ],
            },
            {
                name: 'withdraw',
                inputs: [
                    { name: 'amount', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'withdrawAll',
                inputs: [
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'claimReward',
                inputs: [
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'finishWithdraw',
                inputs: [
                    { name: 'user', type: 'address' },
                    { name: '_withdrawAmount', type: 'uint128' },
                    { name: '_vested', type: 'uint128[]' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'withdrawUnclaimed',
                inputs: [
                    { name: 'to', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'withdrawUnclaimedAll',
                inputs: [
                    { name: 'to', type: 'address' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'addRewardRound',
                inputs: [
                    { components: [{ name: 'startTime', type: 'uint32' }, { name: 'rewardPerSecond', type: 'uint128[]' }], name: 'reward_round', type: 'tuple' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'setEndTime',
                inputs: [
                    { name: 'farm_end_time', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'safeWithdraw',
                inputs: [
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'finishSafeWithdraw',
                inputs: [
                    { name: 'user', type: 'address' },
                    { name: 'amount', type: 'uint128' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'calculateRewardData',
                inputs: [
                ],
                outputs: [
                    { name: '_lastRewardTime', type: 'uint32' },
                    { name: '_accTonPerShare', type: 'uint256[]' },
                    { name: '_unclaimedReward', type: 'uint128[]' },
                ],
            },
            {
                name: 'getUserDataAddress',
                inputs: [
                    { name: '_user', type: 'address' },
                ],
                outputs: [
                    { name: 'value0', type: 'address' },
                ],
            },
        ],
        data: [
            { key: 1, name: 'userDataCode', type: 'cell' },
            { key: 2, name: 'fabric', type: 'address' },
            { key: 3, name: 'deploy_nonce', type: 'uint64' },
        ],
        events: [
            {
                name: 'Deposit',
                inputs: [
                    { name: 'user', type: 'address' },
                    { name: 'amount', type: 'uint128' },
                    { name: 'reward', type: 'uint128[]' },
                    { name: 'reward_debt', type: 'uint128[]' },
                ],
                outputs: [
                ],
            },
            {
                name: 'Withdraw',
                inputs: [
                    { name: 'user', type: 'address' },
                    { name: 'amount', type: 'uint128' },
                    { name: 'reward', type: 'uint128[]' },
                    { name: 'reward_debt', type: 'uint128[]' },
                ],
                outputs: [
                ],
            },
            {
                name: 'Claim',
                inputs: [
                    { name: 'user', type: 'address' },
                    { name: 'reward', type: 'uint128[]' },
                    { name: 'reward_debt', type: 'uint128[]' },
                ],
                outputs: [
                ],
            },
            {
                name: 'RewardDeposit',
                inputs: [
                    { name: 'token_root', type: 'address' },
                    { name: 'amount', type: 'uint128' },
                ],
                outputs: [
                ],
            },
            {
                name: 'RewardRoundAdded',
                inputs: [
                    { components: [{ name: 'startTime', type: 'uint32' }, { name: 'rewardPerSecond', type: 'uint128[]' }], name: 'reward_round', type: 'tuple' },
                ],
                outputs: [
                ],
            },
            {
                name: 'farmEndSet',
                inputs: [
                    { name: 'time', type: 'uint32' },
                ],
                outputs: [
                ],
            },
        ],
        fields: [
            { name: '_pubkey', type: 'uint256' },
            { name: '_timestamp', type: 'uint64' },
            { name: '_constructorFlag', type: 'bool' },
            { name: 'withdrawAllLockPeriod', type: 'uint32' },
            { name: 'lastRewardTime', type: 'uint32' },
            { name: 'farmEndTime', type: 'uint32' },
            { name: 'vestingPeriod', type: 'uint32' },
            { name: 'vestingRatio', type: 'uint32' },
            { name: 'tokenRoot', type: 'address' },
            { name: 'tokenWallet', type: 'address' },
            { name: 'tokenBalance', type: 'uint128' },
            { components: [{ name: 'startTime', type: 'uint32' }, { name: 'rewardPerSecond', type: 'uint128[]' }], name: 'rewardRounds', type: 'tuple[]' },
            { name: 'accTonPerShare', type: 'uint256[]' },
            { name: 'rewardTokenRoot', type: 'address[]' },
            { name: 'rewardTokenWallet', type: 'address[]' },
            { name: 'rewardTokenBalance', type: 'uint128[]' },
            { name: 'rewardTokenBalanceCumulative', type: 'uint128[]' },
            { name: 'unclaimedReward', type: 'uint128[]' },
            { name: 'owner', type: 'address' },
            { name: 'deposit_nonce', type: 'uint64' },
            { components: [{ name: 'user', type: 'address' }, { name: 'amount', type: 'uint128' }, { name: 'send_gas_to', type: 'address' }, { name: 'nonce', type: 'uint32' }], name: 'deposits', type: 'map(uint64,tuple)' },
            { name: 'userDataCode', type: 'cell' },
            { name: 'fabric', type: 'address' },
            { name: 'deploy_nonce', type: 'uint64' },
        ],
    } as const;

    static User = {
        'ABI version': 2,
        version: '2.1',
        header: ['time', 'expire'],
        functions: [
            {
                name: 'constructor',
                inputs: [
                    { name: 'reward_tokens_count', type: 'uint8' },
                    { name: '_vestingPeriod', type: 'uint32' },
                    { name: '_vestingRatio', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'getDetails',
                inputs: [
                    { name: 'answerId', type: 'uint32' },
                ],
                outputs: [
                    { components: [{ name: 'pool_debt', type: 'uint128[]' }, { name: 'entitled', type: 'uint128[]' }, { name: 'vestingTime', type: 'uint32' }, { name: 'amount', type: 'uint128' }, { name: 'rewardDebt', type: 'uint128[]' }, { name: 'farmPool', type: 'address' }, { name: 'user', type: 'address' }], name: 'value0', type: 'tuple' },
                ],
            },
            {
                name: 'pendingReward',
                inputs: [
                    { name: '_accTonPerShare', type: 'uint256[]' },
                    { name: 'poolLastRewardTime', type: 'uint32' },
                    { name: 'farmEndTime', type: 'uint32' },
                ],
                outputs: [
                    { name: '_entitled', type: 'uint128[]' },
                    { name: '_vested', type: 'uint128[]' },
                    { name: '_pool_debt', type: 'uint128[]' },
                    { name: '_vesting_time', type: 'uint32' },
                ],
            },
            {
                name: 'increasePoolDebt',
                inputs: [
                    { name: '_pool_debt', type: 'uint128[]' },
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
            {
                name: 'processDeposit',
                inputs: [
                    { name: 'nonce', type: 'uint64' },
                    { name: '_amount', type: 'uint128' },
                    { name: '_accTonPerShare', type: 'uint256[]' },
                    { name: 'poolLastRewardTime', type: 'uint32' },
                    { name: 'farmEndTime', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'processWithdraw',
                inputs: [
                    { name: '_amount', type: 'uint128' },
                    { name: '_accTonPerShare', type: 'uint256[]' },
                    { name: 'poolLastRewardTime', type: 'uint32' },
                    { name: 'farmEndTime', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'processWithdrawAll',
                inputs: [
                    { name: '_accTonPerShare', type: 'uint256[]' },
                    { name: 'poolLastRewardTime', type: 'uint32' },
                    { name: 'farmEndTime', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'processClaimReward',
                inputs: [
                    { name: '_accTonPerShare', type: 'uint256[]' },
                    { name: 'poolLastRewardTime', type: 'uint32' },
                    { name: 'farmEndTime', type: 'uint32' },
                    { name: 'send_gas_to', type: 'address' },
                    { name: 'nonce', type: 'uint32' },
                ],
                outputs: [
                ],
            },
            {
                name: 'processSafeWithdraw',
                inputs: [
                    { name: 'send_gas_to', type: 'address' },
                ],
                outputs: [
                ],
            },
        ],
        data: [
            { key: 1, name: 'farmPool', type: 'address' },
            { key: 2, name: 'user', type: 'address' },
        ],
        events: [
        ],
        fields: [
            { name: '_pubkey', type: 'uint256' },
            { name: '_timestamp', type: 'uint64' },
            { name: '_constructorFlag', type: 'bool' },
            { name: 'lastRewardTime', type: 'uint32' },
            { name: 'vestingPeriod', type: 'uint32' },
            { name: 'vestingRatio', type: 'uint32' },
            { name: 'vestingTime', type: 'uint32' },
            { name: 'amount', type: 'uint128' },
            { name: 'rewardDebt', type: 'uint128[]' },
            { name: 'entitled', type: 'uint128[]' },
            { name: 'pool_debt', type: 'uint128[]' },
            { name: 'farmPool', type: 'address' },
            { name: 'user', type: 'address' },
        ],
    } as const;

}
