const hre = require("hardhat");

// Real USDT BEP20 token address (BSC mainnet & testnet)
const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955'
const AEOS_BSC = '0x89417b107ad0ef0ce0da82c5d6fd6c81f6e0d25a'

async function main() {
  console.log("🚀 Deploying AEOS Vesting System (Individual Modules)...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📌 Deploying with account: ${deployer.address}`);

  // Get network
  const network = hre.network.name;
  console.log(`🌐 Network: ${network}`);

  // AEOS Token Address (replace with actual address)
  const AEOS_TOKEN = process.env.AEOS_TOKEN_ADDRESS || "0x89417b107ad0ef0ce0da82c5d6fd6c81f6e0d25a";

  // USDT Token Address (BSC mainnet: 0x55d398326f99059fF775485246999027B3197955)
  const USDT_TOKEN = process.env.USDT_TOKEN_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";

  // Wallet addresses (configure these)
  const TREASURY_WALLET = process.env.TREASURY_WALLET || deployer.address;
  const LIQUIDITY_WALLET = process.env.LIQUIDITY_WALLET || deployer.address;
  const COMMUNITY_INCENTIVES_WALLET = process.env.COMMUNITY_INCENTIVES_WALLET || deployer.address;
  const ECOSYSTEM_WALLET = process.env.ECOSYSTEM_WALLET || deployer.address;
  const COMMUNITY_GROWTH_WALLET = process.env.COMMUNITY_GROWTH_WALLET || deployer.address;

  console.log("\n📋 Configuration:");
  console.log(`  AEOS Token: ${AEOS_TOKEN}`);
  console.log(`  USDT Token: ${USDT_TOKEN}`);
  console.log(`  Treasury: ${TREASURY_WALLET}`);
  console.log(`  Liquidity: ${LIQUIDITY_WALLET}`);
  console.log(`  Community Incentives: ${COMMUNITY_INCENTIVES_WALLET}`);
  console.log(`  Ecosystem: ${ECOSYSTEM_WALLET}`);
  console.log(`  Community Growth: ${COMMUNITY_GROWTH_WALLET}`);

  console.log('📦 Step 1: Deploying mock tokens')
  const signers = await hre.ethers.getSigners()

  // Deploy mock USDT (simple - fresh address each time)
  console.log('📦 Step 1A: Deploying MockUSDT…')
  const BEP20USDT = await hre.ethers.getContractFactory('ERC20Mock')
  const usdt = await BEP20USDT.deploy("USDT Tether", "USDT", 18)
  await usdt.waitForDeployment()
  const usdtAddress = await usdt.getAddress()

  await usdt.mint(deployer.address, hre.ethers.parseEther('9000000'))
  for (const signer of signers.slice(1, 10)) {
    await usdt.mint(signer.address, hre.ethers.parseEther('1000000'))
  }
  console.log(`   ✓ MockUSDT deployed at: ${usdtAddress}`)
  console.log(`   ✓ Total USDT to deployer: 11M`)

  // Deploy mock AEOS (simple - fresh address each time)
  console.log('📦 Step 1B: Deploying MockAEOS…')
  const BEP20AEOS = await hre.ethers.getContractFactory('ERC20Mock')
  const aeos = await BEP20AEOS.deploy("AEOS COIN", "AEOS", 18)
  await aeos.waitForDeployment()
  const aeosAddress = await aeos.getAddress()

  await aeos.mint(deployer.address, hre.ethers.parseEther('9000000'))
  for (const signer of signers.slice(1, 10)) {
    await aeos.mint(signer.address, hre.ethers.parseEther('1000000'))
  }
  console.log(`   ✓ MockAEOS deployed at: ${aeosAddress}`)
  console.log(`   ✓ Total AEOS to deployer: 11M`)

  // ✅ Check balances
  console.log('\n💰 Checking token balances...')
  const bnbBalance = await hre.ethers.provider.getBalance(deployer.address)
  const usdtBalance = await usdt.balanceOf(deployer.address)
  const aeosBalance = await aeos.balanceOf(deployer.address)
  console.log(`   ✓ Deployer BNB Balance: ${hre.ethers.formatEther(bnbBalance)} BNB`)
  console.log(`   ✓ Deployer USDT Balance: ${hre.ethers.formatEther(usdtBalance)} USDT`)
  console.log(`   ✓ Deployer AEOS Balance: ${hre.ethers.formatEther(aeosBalance)} AEOS`)
  console.log(`   ✓ Deployer Address: ${deployer.address}`)

  // Deploy individual vesting modules (factory contract is too large)
  console.log("\n🏗️ Deploying vesting modules...");

  const TeamVesting = await hre.ethers.getContractFactory("AeosVestingTeam");
  const teamModule = await TeamVesting.deploy(aeosAddress);
  await teamModule.waitForDeployment();
  const teamAddr = await teamModule.getAddress();
  console.log(`✅ Team & Founders deployed to: ${teamAddr}`);

  const StrategicVesting = await hre.ethers.getContractFactory("AeosVestingStrategic");
  const strategicModule = await StrategicVesting.deploy(aeosAddress, usdtAddress);
  await strategicModule.waitForDeployment();
  const strategicAddr = await strategicModule.getAddress();
  console.log(`✅ Strategic Investors deployed to: ${strategicAddr}`);

  const AdvisorsVesting = await hre.ethers.getContractFactory("AeosVestingAdvisors");
  const advisorsModule = await AdvisorsVesting.deploy(aeosAddress, usdtAddress);
  await advisorsModule.waitForDeployment();
  const advisorsAddr = await advisorsModule.getAddress();
  console.log(`✅ Advisors & Partnerships deployed to: ${advisorsAddr}`);

  const ReservesVesting = await hre.ethers.getContractFactory("AeosVestingReserves");
  const reservesModule = await ReservesVesting.deploy(
    LIQUIDITY_WALLET,
    COMMUNITY_INCENTIVES_WALLET,
    ECOSYSTEM_WALLET,
    COMMUNITY_GROWTH_WALLET
  );
  await reservesModule.waitForDeployment();
  const reservesAddr = await reservesModule.getAddress();
  console.log(`✅ Reserves deployed to: ${reservesAddr}`);

  console.log("\n📦 Module Addresses:");
  console.log(`  Team & Founders: ${teamAddr}`);
  console.log(`  Strategic Investors: ${strategicAddr}`);
  console.log(`  Advisors & Partnerships: ${advisorsAddr}`);
  console.log(`  Reserves: ${reservesAddr}`);

  // Save deployment info
  const deployment = {
    network,
    timestamp: new Date().toISOString(),
    contracts: {
      team: teamAddr,
      strategic: strategicAddr,
      advisors: advisorsAddr,
      reserves: reservesAddr,
    },
    tokens: {
      aeos: aeosAddress,
      usdt: usdtAddress,
    },
    wallets: {
      treasury: TREASURY_WALLET,
      liquidity: LIQUIDITY_WALLET,
      communityIncentives: COMMUNITY_INCENTIVES_WALLET,
      ecosystem: ECOSYSTEM_WALLET,
      communityGrowth: COMMUNITY_GROWTH_WALLET,
    },
  };

  const fs = require("fs");
  const path = require("path");

  // Ensure deployments folder exists
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Source of truth: always overwrite deployment-latest.json
  const latestFile = path.join(deploymentsDir, 'deployment-latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(deployment, null, 2));

  // Also keep timestamped version for history
  const timestampedFile = path.join(deploymentsDir, `deployment-${network}-${Date.now()}.json`);
  fs.writeFileSync(timestampedFile, JSON.stringify(deployment, null, 2));

  console.log(`\n💾 Deployment saved to:`);
  console.log(`   ✓ Source of truth: ${path.relative(process.cwd(), latestFile)}`);
  console.log(`   ✓ Historical record: ${path.relative(process.cwd(), timestampedFile)}`);

  console.log("\n✨ Deployment complete! Next steps:");
  console.log("   1. Fund the contracts with AEOS tokens");
  console.log("   2. Verify contracts on BSCScan");
  console.log("   3. Begin using the vesting system");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
