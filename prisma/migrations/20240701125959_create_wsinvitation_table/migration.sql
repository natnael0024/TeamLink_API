-- CreateTable
CREATE TABLE "WorkspaceInvitation" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceInvitation_token_key" ON "WorkspaceInvitation"("token");

-- CreateIndex
CREATE INDEX "WorkspaceInvitation_workspace_id_idx" ON "WorkspaceInvitation"("workspace_id");

-- CreateIndex
CREATE INDEX "Attachment_message_id_idx" ON "Attachment"("message_id");

-- CreateIndex
CREATE INDEX "Channel_workspace_id_idx" ON "Channel"("workspace_id");

-- CreateIndex
CREATE INDEX "ChannelMember_channel_id_idx" ON "ChannelMember"("channel_id");

-- CreateIndex
CREATE INDEX "Message_id_idx" ON "Message"("id");

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User"("id");

-- CreateIndex
CREATE INDEX "Workspace_id_idx" ON "Workspace"("id");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspace_id_idx" ON "WorkspaceMember"("workspace_id");

-- AddForeignKey
ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
