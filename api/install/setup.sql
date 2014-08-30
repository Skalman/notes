CREATE TABLE notebooks (
  user_id int(10) unsigned NOT NULL,
  revision char(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  content blob NOT NULL,
  format varchar(15) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  UNIQUE KEY user_id (user_id)
) ENGINE=InnoDB;

CREATE TABLE users (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  email varchar(63) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB;


ALTER TABLE notebooks
  ADD CONSTRAINT notebooks_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
