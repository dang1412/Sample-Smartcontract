import { expect } from "chai"
import { ethers } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

import { LandToken721__factory, LandToken721 } from "../typechain"

async function ownedTokensArray(landToken721: LandToken721, addr: string): Promise<number[]> {
  const balance = (await landToken721.balanceOf(addr)).toNumber()
  const tokens: number[] = []
  for (let i = 0; i < balance; i++) {
    const tokenId = (await landToken721.tokenOfOwnerByIndex(addr, i)).toNumber()
    tokens.push(tokenId)
  }

  return tokens
}

describe("LandToken721", () => {
  let [acc1, acc2, acc3]: SignerWithAddress[] = []
  let LandToken721: LandToken721__factory
  let landToken721: LandToken721

  beforeEach(async () => {
    [acc1, acc2, acc3] = await ethers.getSigners()
    LandToken721 = await ethers.getContractFactory("LandToken721")
    landToken721 = await LandToken721.deploy()
    await landToken721.deployed()

    const value = await landToken721.mintPrice()
    await landToken721.mint({ value })  // TokenID 1
    await landToken721.mint({ value })  // 2
    await landToken721.mint({ value })  // 3
    await landToken721.connect(acc2).mint({ value })  // 4
    await landToken721.connect(acc3).mint({ value })  // 5
  })

  describe("Ownable", () => {
    it("Owner should be acc1", async () => {
      const owner = await landToken721.owner()
      expect(owner).to.equal(acc1.address)
    })

    it("Should transfer ownership to acc2", async () => {
      await landToken721.transferOwnership(acc2.address)
      const owner = await landToken721.owner()
      expect(owner).to.equal(acc2.address)
    })
  })

  describe("ERC721", () => {
    it("Check balances", async () => {
      expect(await landToken721.balanceOf(acc1.address)).to.equal(3)
      expect(await landToken721.balanceOf(acc2.address)).to.equal(1)
      expect(await landToken721.balanceOf(acc3.address)).to.equal(1)
      expect(await ethers.provider.getBalance(landToken721.address)).to.equal(5e18.toString())
    })

    it("Accounts should own tokens", async () => {
      expect(await landToken721.ownerOf(1)).to.equal(acc1.address)
      expect(await landToken721.ownerOf(2)).to.equal(acc1.address)
      expect(await landToken721.ownerOf(3)).to.equal(acc1.address)
      expect(await landToken721.ownerOf(4)).to.equal(acc2.address)
      expect(await landToken721.ownerOf(5)).to.equal(acc3.address)
    })

    it("Should transfer token from acc1 to acc2", async () => {
      await landToken721.transferFrom(acc1.address, acc2.address, 1)

      expect(await landToken721.balanceOf(acc1.address)).to.equal(2)
      expect(await landToken721.balanceOf(acc2.address)).to.equal(2)
      expect(await landToken721.ownerOf(1)).to.equal(acc2.address)
    })

    it("Should throw error when transfer nonexistent", async () => {
      await expect(landToken721.transferFrom(acc1.address, acc2.address, 9)).to.be.revertedWith("ERC721: operator query for nonexistent token")
    })

    it("Should throw error when transfer not owned token", async () => {
      await expect(landToken721.transferFrom(acc3.address, acc2.address, 4)).to.be.revertedWith("ERC721: transfer caller is not owner nor approved")
    })

    it("Should transfer not owned token when approved", async () => {
      await landToken721.connect(acc3).approve(acc1.address, 5)
      await landToken721.transferFrom(acc3.address, acc2.address, 5)

      expect(await landToken721.balanceOf(acc3.address)).to.equal(0)
      expect(await landToken721.balanceOf(acc2.address)).to.equal(2)
      expect(await landToken721.ownerOf(5)).to.equal(acc2.address)
    })

    it("Should transfer not owned token when approved all", async () => {
      await landToken721.setApprovalForAll(acc2.address, true)
      await landToken721.connect(acc2).transferFrom(acc1.address, acc2.address, 1)

      expect(await landToken721.balanceOf(acc1.address)).to.equal(2)
      expect(await landToken721.balanceOf(acc2.address)).to.equal(2)
      expect(await landToken721.ownerOf(1)).to.equal(acc2.address)
    })

    it("Token URI", async () => {
      await landToken721.setBaseURI("www.mygame.com/token/")

      expect(await landToken721.tokenURI(1)).to.equal("www.mygame.com/token/1")
      expect(await landToken721.tokenURI(2)).to.equal("www.mygame.com/token/2")
      expect(await landToken721.tokenURI(3)).to.equal("www.mygame.com/token/3")
    })
  })

  describe("ERC721 Enumerable", () => {
    it("Total supply", async () => {
      expect(await landToken721.totalSupply()).to.equal(5)
    })

    it("Owned tokens array", async () => {
      expect(await ownedTokensArray(landToken721, acc1.address)).to.eql([1,2,3])
      expect(await ownedTokensArray(landToken721, acc2.address)).to.eql([4])
      expect(await ownedTokensArray(landToken721, acc3.address)).to.eql([5])
    })

    it("Should transfer token from acc1 to acc2", async () => {
      await landToken721.transferFrom(acc1.address, acc2.address, 1)

      // Thứ tự token đảo lại là [3,2] chứ không phải [2,3]
      expect(await ownedTokensArray(landToken721, acc1.address)).to.eql([3,2])
      expect(await ownedTokensArray(landToken721, acc2.address)).to.eql([4,1])
    })
  })
})
