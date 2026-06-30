using System.Collections.Generic;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;

namespace PeriodIQ.Core.Services;

public class ExerciseService
{
    private readonly IExerciseRepository _repository;

    public ExerciseService(IExerciseRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<Exercise>> GetAllAsync() => await _repository.GetAllAsync();
    public async Task<Exercise> GetByIdAsync(string id) => await _repository.GetByIdAsync(id);
    public async Task AddAsync(Exercise entity) => await _repository.AddAsync(entity);
    public async Task UpdateAsync(Exercise entity) => await _repository.UpdateAsync(entity);
    public async Task DeleteAsync(string id) => await _repository.DeleteAsync(id);
}
