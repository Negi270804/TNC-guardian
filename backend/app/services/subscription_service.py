import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone, timedelta
from app.repositories.subscription_repository import SubscriptionRepository
from app.repositories.usage_repository import UsageRepository
from app.models.subscription import Subscription
from app.models.usage import Usage
from app.models.user import User

class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.sub_repo = SubscriptionRepository(db)
        self.usage_repo = UsageRepository(db)

    async def get_or_create_subscription(self, user_id: uuid.UUID) -> Subscription:
        sub = await self.sub_repo.get_by_user_id(user_id)
        if not sub:
            sub = Subscription(
                user_id=user_id,
                plan="FREE",
                status="ACTIVE",
                start_date=datetime.now(timezone.utc),
                renewal_date=datetime.now(timezone.utc) + timedelta(days=30)
            )
            sub = await self.sub_repo.create(sub)
        return sub

    async def get_or_create_usage(self, user_id: uuid.UUID, month: Optional[int] = None, year: Optional[int] = None) -> Usage:
        now = datetime.now(timezone.utc)
        target_month = month if month is not None else now.month
        target_year = year if year is not None else now.year
        
        usage = await self.usage_repo.get_by_user_period(user_id, target_month, target_year)
        if not usage:
            usage = Usage(
                user_id=user_id,
                month=target_month,
                year=target_year,
                analysis_count=0,
                documents_uploaded=0,
                storage_used=0
            )
            usage = await self.usage_repo.create(usage)
        return usage

    async def upgrade_plan(self, user_id: uuid.UUID, plan: str) -> Subscription:
        if plan not in ("FREE", "PRO"):
            raise ValueError("Invalid plan name. Supported plans: FREE, PRO")
            
        sub = await self.get_or_create_subscription(user_id)
        
        sub.plan = plan
        sub.status = "ACTIVE"
        now = datetime.now(timezone.utc)
        sub.start_date = now
        sub.renewal_date = now + timedelta(days=30)
        sub.end_date = None  # Active plan has no end_date
        
        return await self.sub_repo.update(sub)

    async def cancel_subscription(self, user_id: uuid.UUID) -> Subscription:
        sub = await self.get_or_create_subscription(user_id)
        
        # Downgrade to FREE, set status to ACTIVE
        sub.plan = "FREE"
        sub.status = "ACTIVE"
        now = datetime.now(timezone.utc)
        sub.start_date = now
        sub.renewal_date = now + timedelta(days=30)
        sub.end_date = None
        
        return await self.sub_repo.update(sub)

    async def increment_analysis_count(self, user_id: uuid.UUID) -> Usage:
        now = datetime.now(timezone.utc)
        usage = await self.get_or_create_usage(user_id, now.month, now.year)
        usage.analysis_count += 1
        return await self.usage_repo.update(usage)

    async def increment_uploads(self, user_id: uuid.UUID, file_size_bytes: int) -> Usage:
        now = datetime.now(timezone.utc)
        usage = await self.get_or_create_usage(user_id, now.month, now.year)
        usage.documents_uploaded += 1
        usage.storage_used += file_size_bytes
        return await self.usage_repo.update(usage)

    async def reset_monthly_usage(self) -> int:
        """
        Scans all users and pre-initializes usage records for the current month and year.
        Also checks for expired PRO plans (past renewal_date) and downgrades them.
        Returns the number of users processed.
        """
        now = datetime.now(timezone.utc)
        current_month = now.month
        current_year = now.year

        # Get all users
        result = await self.db.execute(select(User))
        users = result.scalars().all()
        
        count = 0
        for user in users:
            # 1. Initialize usage for current month
            usage = await self.usage_repo.get_by_user_period(user.id, current_month, current_year)
            if not usage:
                usage = Usage(
                    user_id=user.id,
                    month=current_month,
                    year=current_year,
                    analysis_count=0,
                    documents_uploaded=0,
                    storage_used=0
                )
                await self.usage_repo.create(usage)
                
            # 2. Check and rollover subscriptions if necessary
            sub = await self.sub_repo.get_by_user_id(user.id)
            if sub and sub.plan == "PRO" and sub.renewal_date and sub.renewal_date < now:
                # If active, extend renewal date. If cancelled/inactive, downgrade to FREE
                if sub.status == "ACTIVE":
                    sub.renewal_date = sub.renewal_date + timedelta(days=30)
                    await self.sub_repo.update(sub)
                else:
                    sub.plan = "FREE"
                    sub.status = "ACTIVE"
                    sub.renewal_date = now + timedelta(days=30)
                    await self.sub_repo.update(sub)
            
            count += 1
            
        return count
