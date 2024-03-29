import { task } from "hardhat/config"
import { readFileSync, writeFileSync } from "../helpers/pathHelper"

task("deploy:contract", "Deploy contract")
  .addParam("contract")
  .setAction(async ({ contract }, hre) => {
    await hre.run("compile")
    const [signer]: any = await hre.ethers.getSigners()
    const contractFactory = await hre.ethers.getContractFactory(contract)
    // if you mint in constructor, you need to add value in deploy function
    const deployContract: any = await contractFactory.connect(signer).deploy()
    console.log(`TestToken.sol deployed to ${deployContract.address}`)

    const address = {
      main: deployContract.address,
    }
    const addressData = JSON.stringify(address)
    writeFileSync(`scripts/address/${hre.network.name}/`, "mainContract.json", addressData)

    await deployContract.deployed()
  },
  )

task("deploy:token", "Deploy Token")
  .addFlag("verify", "Validate contract after deploy")
  .setAction(async ({ verify }, hre) => {
    await hre.run("compile")
    const [signer]: any = await hre.ethers.getSigners()
    const feeData = await hre.ethers.provider.getFeeData()

    const donateTokenFactory = await hre.ethers.getContractFactory("contracts/DonateToken.sol:DonateToken", )
    const amount = BigInt(100000000000000)
    const donateTokenDeployContract: any = await donateTokenFactory.connect(signer).deploy(amount, {
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      maxFeePerGas: feeData.maxFeePerGas,
      // gasLimit: 6000000, // optional: for some weird infra network
    })
    console.log(`DonateToken.sol deployed to ${donateTokenDeployContract.address}`)

    const address = {
      main: donateTokenDeployContract.address,
    }
    const addressData = JSON.stringify(address)
    writeFileSync(`scripts/address/${hre.network.name}/`, "DonateToken.json", addressData)

    await donateTokenDeployContract.deployed()

    if (verify) {
      console.log("verifying contract...")
      await donateTokenDeployContract.deployTransaction.wait(3)
      try {
        await hre.run("verify:verify", {
          address: donateTokenDeployContract.address,
          constructorArguments: [100000000000000],
          contract: "contracts/DonateToken.sol:DonateToken",
        })
      } catch (e) {
        console.log(e)
      }
    }
  },
  )

  task("deploy:nftFactory", "Deploy NFT factory")
  .addFlag("verify", "Validate contract after deploy")
  .setAction(async ({ verify }, hre) => {
    await hre.run("compile")
    const [signer]: any = await hre.ethers.getSigners()
    const feeData = await hre.ethers.provider.getFeeData()

    const globalContractFactory = await hre.ethers.getContractFactory("contracts/Globals.sol:Globals", )
    const globalDeployContract: any = await globalContractFactory.connect(signer).deploy({
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      maxFeePerGas: feeData.maxFeePerGas,
      // gasLimit: 6000000, // optional: for some weird infra network
    })
    console.log(`Globals.sol deployed to ${globalDeployContract.address}`)
    await globalDeployContract.deployed()

    const tokenAddress = JSON.parse(readFileSync(
      `scripts/address/${hre.network.name}/`,
      "DonateToken.json"
    ))
    const nftContractFactory = await hre.ethers.getContractFactory("contracts/DonateNFTFactory.sol:DonateNFTFactory", )
    const nftDeployContract: any = await nftContractFactory.connect(signer).deploy(
      globalDeployContract.address,
      tokenAddress.main, 
      {
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        maxFeePerGas: feeData.maxFeePerGas,
        // gasLimit: 6000000, // optional: for some weird infra network
    })
    console.log(`DonateNFTFactory.sol deployed to ${nftDeployContract.address}`)

    const address = {
      globals: globalDeployContract.address,
      main: nftDeployContract.address,
    }
    const addressData = JSON.stringify(address)
    writeFileSync(`scripts/address/${hre.network.name}/`, "DonateNFTFactory.json", addressData)

    await nftDeployContract.deployed()

    if (verify) {
      console.log("verifying global contract...")
      await globalDeployContract.deployTransaction.wait(3)
      try {
        await hre.run("verify:verify", {
          address: globalDeployContract.address,
          contract: "contracts/Globals.sol:Globals",
        })
      } catch (e) {
        console.log(e)
      }
      console.log("verifying nft contract...")
      await nftDeployContract.deployTransaction.wait(3)
      try {
        await hre.run("verify:verify", {
          address: nftDeployContract.address,
          constructorArguments: [100000000000000],
          contract: "contracts/DonateToken.sol:DonateToken",
        })
      } catch (e) {
        console.log(e)
      }
    }
  },
  )
