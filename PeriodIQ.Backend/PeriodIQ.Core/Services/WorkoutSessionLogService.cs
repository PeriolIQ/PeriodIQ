using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;

namespace PeriodIQ.Core.Services;

public class WorkoutSessionLogService
{
    private readonly IWorkoutSessionLogRepository _repository;
    private readonly IProgressRepository _progressRepository;

    public WorkoutSessionLogService(IWorkoutSessionLogRepository repository, IProgressRepository progressRepository)
    {
        _repository = repository;
        _progressRepository = progressRepository;
    }

    public async Task<IEnumerable<WorkoutSessionLog>> GetAllAsync() => await _repository.GetAllAsync();
    public async Task<WorkoutSessionLog> GetByIdAsync(string id) => await _repository.GetByIdAsync(id);
    
    public async Task AddAsync(WorkoutSessionLog entity)
    {
        await _repository.AddAsync(entity);
        
        // Update user progress (XP and Streak)
        if (!string.IsNullOrEmpty(entity.UserId))
        {
            var progress = await _progressRepository.GetByIdAsync(entity.UserId);
            if (progress == null)
            {
                progress = new Progress { Id = entity.UserId, UserId = entity.UserId };
            }

            // Calculate Streak
            var today = DateTime.UtcNow.Date;
            if (progress.LastWorkoutDate.HasValue)
            {
                var lastWorkout = progress.LastWorkoutDate.Value.Date;
                if (lastWorkout == today.AddDays(-1))
                {
                    // Consecutive day
                    progress.CurrentStreak++;
                }
                else if (lastWorkout < today.AddDays(-1))
                {
                    // Missed a day
                    progress.CurrentStreak = 1;
                }
                // If lastWorkout == today, streak doesn't increase but remains the same
            }
            else
            {
                // First workout ever
                progress.CurrentStreak = 1;
            }

            if (progress.CurrentStreak > progress.LongestStreak)
            {
                progress.LongestStreak = progress.CurrentStreak;
            }

            progress.LastWorkoutDate = DateTime.UtcNow;
            progress.XP += 50; // Award 50 XP per workout session

            // Save Progress
            if (string.IsNullOrEmpty(progress.CreatedAt.ToString()) || progress.CreatedAt == default)
            {
                await _progressRepository.AddAsync(progress);
            }
            else
            {
                await _progressRepository.UpdateAsync(progress);
            }
        }
    }

    public async Task UpdateAsync(WorkoutSessionLog entity) => await _repository.UpdateAsync(entity);
    public async Task DeleteAsync(string id) => await _repository.DeleteAsync(id);
}
