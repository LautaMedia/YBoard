ALTER TABLE `post_reply`
    ADD `user_id` INT(10) UNSIGNED NULL DEFAULT NULL AFTER `post_id_replied`,
    ADD INDEX user_id (`user_id`),
    ADD CONSTRAINT post_reply_user_id FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
