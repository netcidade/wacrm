import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt, isLegacyFormat } from "./encryption";

const KEY_HEX = process.env.ENCRYPTION_KEY!;

function cbcEncryptLegacy(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(KEY_HEX, "hex"),
    iv,
  );
  let ct = cipher.update(plaintext, "utf8", "hex");
  ct += cipher.final("hex");
  return `${iv.toString("hex")}:${ct}`;
}

describe("encryption", () => {
  describe("encrypt / decrypt round-trip", () => {
    it("recovers the original plaintext", async () => {
      const ct = await encrypt("EAAG... fake WhatsApp token");
      expect(await decrypt(ct)).toBe("EAAG... fake WhatsApp token");
    });

    it("produces three colon-separated parts (GCM)", async () => {
      const ct = await encrypt("anything");
      expect(ct.split(":")).toHaveLength(3);
    });

    it("uses a fresh IV per encrypt so identical plaintexts produce different ciphertexts", async () => {
      const a = await encrypt("same input");
      const b = await encrypt("same input");
      expect(a).not.toBe(b);
      expect(await decrypt(a)).toBe("same input");
      expect(await decrypt(b)).toBe("same input");
    });

    it("roundtrips empty string", async () => {
      const ct = await encrypt("");
      expect(await decrypt(ct)).toBe("");
    });

    it("roundtrips multibyte UTF-8", async () => {
      const ct = await encrypt("token-✓-🔐-žąsis");
      expect(await decrypt(ct)).toBe("token-✓-🔐-žąsis");
    });
  });

  describe("GCM authentication", () => {
    it("rejects ciphertext tampered after encryption", async () => {
      const ct = await encrypt("secret");
      const [ivHex, ctHex, tagHex] = ct.split(":");
      const tamperedCtHex =
        (parseInt(ctHex.slice(0, 2), 16) ^ 0xff).toString(16).padStart(2, "0") +
        ctHex.slice(2);
      await expect(
        decrypt(`${ivHex}:${tamperedCtHex}:${tagHex}`),
      ).rejects.toThrow();
    });

    it("rejects a swapped auth tag", async () => {
      const ct = await encrypt("secret");
      const [ivHex, ctHex] = ct.split(":");
      const bogusTag = "00".repeat(16);
      await expect(decrypt(`${ivHex}:${ctHex}:${bogusTag}`)).rejects.toThrow();
    });

    it("rejects a GCM IV of the wrong length", async () => {
      const ct = await encrypt("secret");
      const [, ctHex, tagHex] = ct.split(":");
      const shortIv = "00".repeat(8);
      await expect(decrypt(`${shortIv}:${ctHex}:${tagHex}`)).rejects.toThrow(
        /GCM IV length/,
      );
    });

    it("rejects a GCM auth tag of the wrong length", async () => {
      const ct = await encrypt("secret");
      const [ivHex, ctHex] = ct.split(":");
      const shortTag = "00".repeat(8);
      await expect(decrypt(`${ivHex}:${ctHex}:${shortTag}`)).rejects.toThrow(
        /auth-tag length/,
      );
    });
  });

  describe("legacy CBC compatibility (read-only)", () => {
    it("decrypts a CBC blob produced by the previous codepath", async () => {
      const legacy = cbcEncryptLegacy("old-token");
      expect(await decrypt(legacy)).toBe("old-token");
    });

    it("rejects a CBC blob with the wrong IV length", async () => {
      const bogus = "00".repeat(8) + ":" + "00".repeat(16);
      await expect(decrypt(bogus)).rejects.toThrow(/CBC IV length/);
    });
  });

  describe("format detection", () => {
    it("isLegacyFormat returns true for two-part CBC strings", () => {
      const legacy = cbcEncryptLegacy("anything");
      expect(isLegacyFormat(legacy)).toBe(true);
    });

    it("isLegacyFormat returns false for three-part GCM strings", async () => {
      const modern = await encrypt("anything");
      expect(isLegacyFormat(modern)).toBe(false);
    });
  });

  describe("malformed input", () => {
    it("throws on a single-token blob (no colons)", async () => {
      await expect(decrypt("not-encrypted-at-all")).rejects.toThrow(
        /unrecognised format/,
      );
    });

    it("throws on a four-part blob", async () => {
      await expect(decrypt("aa:bb:cc:dd")).rejects.toThrow(/unrecognised format/);
    });
  });
});
