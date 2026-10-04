-- Run this in phpMyAdmin with the new CartandGo database selected.
-- Preserve these records across deployments: deleting them permits payment reuse.
CREATE TABLE IF NOT EXISTS payment_redemptions (
  namespace VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  transaction_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  checkout_ref VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (namespace, transaction_id)
) ENGINE=InnoDB;
