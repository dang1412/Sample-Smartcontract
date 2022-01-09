import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { GLDToken__factory, GLDToken } from "../typechain"

const InitSupply = 1000

describe("GLDToken", () => {
  let [owner, acc1, acc2]: SignerWithAddress[] = []
  let GLDToken: GLDToken__factory
  let gldToken: GLDToken

  beforeEach(async () => {
    [owner, acc1, acc2] = await ethers.getSigners()
    GLDToken = await ethers.getContractFactory("GLDToken")
    gldToken = await GLDToken.deploy(InitSupply)
    await gldToken.deployed()
  })

  it("Should deploy with initial supply", async () => {
    expect(await gldToken.balanceOf(owner.address)).to.equal(1000)
  })

  describe("Transfer", () => {
    it("Should transfer to acc1", async () => {
      await gldToken.transfer(acc1.address, 100)
      expect(await gldToken.balanceOf(owner.address)).to.equal(900)
      expect(await gldToken.balanceOf(acc1.address)).to.equal(100)

      gldToken.on("Transfer", (from: string, to: string, amount: number) => {
        console.log("Event emitted", from, to, amount)
      })
    })

    it("Should revert when transfer amount exceeds", async () => {
      await expect(gldToken.transfer(acc1.address, 1001)).to.be.revertedWith("ERC20: transfer amount exceeds balance")
      expect(await gldToken.balanceOf(owner.address)).to.equal(1000)
      expect(await gldToken.balanceOf(acc1.address)).to.equal(0)
    })
  })

  describe("When approval", () => {
    beforeEach(async () => {
      gldToken.approve(acc1.address, 150)
    })

    it("Should allow 150", async () => {
      expect(await gldToken.allowance(owner.address, acc1.address)).to.equal(150)
    })

    it("Should revert when try transferFrom larger than approved", async () => {
      await expect(gldToken.connect(acc1).transferFrom(owner.address, acc2.address, 160)).to.be.revertedWith("ERC20: transfer amount exceeds allowance")
    })

    it("Should transferFrom owner to acc2 by acc1", async () => {
      await gldToken.connect(acc1).transferFrom(owner.address, acc2.address, 100)

      // check balance
      expect(await gldToken.balanceOf(owner.address)).to.equal(900)
      expect(await gldToken.balanceOf(acc2.address)).to.equal(100)

      // check remaining allownance
      expect(await gldToken.allowance(owner.address, acc1.address)).to.equal(50)
    })
  })
})
