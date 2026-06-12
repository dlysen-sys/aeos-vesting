const hre = require('hardhat')

async function main() {
  const provider = hre.ethers.provider

  const addresses = {
    usdt: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    aeos: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
  }

  console.log('🔍 Verifying deployed contracts...\n')

  for (const [name, address] of Object.entries(addresses)) {
    const bytecode = await provider.getCode(address)
    const exists = bytecode !== '0x'
    const status = exists ? '✅ EXISTS' : '❌ MISSING'
    console.log(`${status} | ${name} @ ${address}`)

    if (exists) {
      try {
        const contract = new hre.ethers.Contract(
          address,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        )
        const balance = await contract.balanceOf(hre.ethers.getAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'))
        console.log(`         Balance: ${hre.ethers.formatEther(balance)} tokens`)
      } catch (e) {
        console.log(`         Error calling balanceOf: ${e.message}`)
      }
    }
  }
}

main().catch(console.error)
