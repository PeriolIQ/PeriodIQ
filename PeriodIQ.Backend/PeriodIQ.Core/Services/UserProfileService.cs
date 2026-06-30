using System.Collections.Generic;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;

namespace PeriodIQ.Core.Services;

public class UserProfileService
{
    private readonly IUserProfileRepository _repository;

    public UserProfileService(IUserProfileRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<UserProfile>> GetAllAsync() => await _repository.GetAllAsync();
    public async Task<UserProfile> GetByIdAsync(string id) => await _repository.GetByIdAsync(id);
    public async Task AddAsync(UserProfile entity) => await _repository.AddAsync(entity);
    public async Task UpdateAsync(UserProfile entity) => await _repository.UpdateAsync(entity);
    public async Task DeleteAsync(string id) => await _repository.DeleteAsync(id);
}
