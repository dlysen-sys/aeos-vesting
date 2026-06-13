const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // Addresses from latest deployment
  const AEOS_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
  const STRATEGIC_ADDRESS = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";
  const ADVISORS_ADDRESS = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";
  const TEAM_ADDRESS = "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44";

  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
  ];

  const aeos = await hre.ethers.getContractAt(ERC20_ABI, AEOS_ADDRESS, deployer);

  console.log("\n💰 Funding Vesting Contracts with AEOS...");
  console.log(`Deployer balance: ${hre.ethers.formatEther(await aeos.balanceOf(deployer.address))} AEOS`);

  // Fund Strategic
  const strategicAmount = hre.ethers.parseEther("2000000");
  console.log(`\n📤 Funding Strategic Investors: ${hre.ethers.formatEther(strategicAmount)} AEOS`);
  await aeos.transfer(STRATEGIC_ADDRESS, strategicAmount);
  console.log(`✅ Strategic funded`);

  // Fund Advisors
  const advisorsAmount = hre.ethers.parseEther("1000000");
  console.log(`\n📤 Funding Advisors: ${hre.ethers.formatEther(advisorsAmount)} AEOS`);
  await aeos.transfer(ADVISORS_ADDRESS, advisorsAmount);
  console.log(`✅ Advisors funded`);

  // Fund Team
  const teamAmount = hre.ethers.parseEther("500000");
  console.log(`\n📤 Funding Team: ${hre.ethers.formatEther(teamAmount)} AEOS`);
  await aeos.transfer(TEAM_ADDRESS, teamAmount);
  console.log(`✅ Team funded`);

  console.log("\n✨ All contracts funded!");
  console.log(`Remaining deployer balance: ${hre.ethers.formatEther(await aeos.balanceOf(deployer.address))} AEOS`);
}

main().catch(console.error);
