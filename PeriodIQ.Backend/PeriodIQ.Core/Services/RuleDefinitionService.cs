using System.Collections.Generic;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;

namespace PeriodIQ.Core.Services;

public class RuleDefinitionService
{
    private readonly IRuleDefinitionRepository _repository;

    public RuleDefinitionService(IRuleDefinitionRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<RuleDefinition>> GetAllAsync() => await _repository.GetAllAsync();
    public async Task<RuleDefinition> GetByIdAsync(string id) => await _repository.GetByIdAsync(id);
    public async Task AddAsync(RuleDefinition entity) => await _repository.AddAsync(entity);
    public async Task UpdateAsync(RuleDefinition entity) => await _repository.UpdateAsync(entity);
    public async Task DeleteAsync(string id) => await _repository.DeleteAsync(id);
}
