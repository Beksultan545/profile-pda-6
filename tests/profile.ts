import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Profile } from "../target/types/profile";
import { expect } from "chai";

describe("profile", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.profile as Program<Profile>;
  const authority = provider.wallet.publicKey;

  // PDA мекенжайын seeds арқылы есептеу: ["profile", authority]
  const [profilePda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), authority.toBuffer()],
    program.programId
  );

  it("Creates a profile", async () => {
    console.log("Program ID:", program.programId.toBase58());
    console.log("Authority:", authority.toBase58());
    console.log("Profile PDA:", profilePda.toBase58(), "bump:", bump);

    const existing = await provider.connection.getAccountInfo(profilePda);
    if (existing === null) {
      const tx = await program.methods
        .createProfile("Beksultan", "My first on-chain profile on Solana")
        .accountsPartial({ profile: profilePda })
        .rpc();
      console.log("Create profile tx:", tx);
    } else {
      console.log("Profile already exists");
    }

    const account = await program.account.userProfile.fetch(profilePda);
    console.log("Profile data:", {
      authority: account.authority.toBase58(),
      name: account.name,
      bio: account.bio,
      bump: account.bump,
    });
    expect(account.authority.toBase58()).to.equal(authority.toBase58());
  });

  it("Updates the profile", async () => {
    const tx = await program.methods
      .updateProfile("Beksultan K.", "Updated bio: learning Solana")
      .accountsPartial({ profile: profilePda })
      .rpc();
    console.log("Update profile tx:", tx);

    const account = await program.account.userProfile.fetch(profilePda);
    console.log("Profile data after update:", {
      name: account.name,
      bio: account.bio,
    });
    expect(account.name).to.equal("Beksultan K.");
    expect(account.bio).to.equal("Updated bio: learning Solana");
  });
});
