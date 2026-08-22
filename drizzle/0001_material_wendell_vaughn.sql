CREATE TABLE `operation_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessKey` varchar(80) NOT NULL,
	`revision` int NOT NULL DEFAULT 1,
	`payload` mediumtext NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operation_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `operation_snapshots_user_business_unique` UNIQUE(`userId`,`businessKey`)
);
