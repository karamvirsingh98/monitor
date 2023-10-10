use derive_empty_traits::EmptyTraits;
use resolver_api::derive::Request;
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::entities::update::Update;

use super::MonitorExecuteRequest;

//

#[typeshare]
#[derive(
    Serialize, Deserialize, Debug, Clone, Request, EmptyTraits,
)]
#[empty_traits(MonitorExecuteRequest)]
#[response(Update)]
pub struct RunBuild {
    pub build_id: String,
}

//

#[typeshare]
#[derive(
    Serialize, Deserialize, Debug, Clone, Request, EmptyTraits,
)]
#[empty_traits(MonitorExecuteRequest)]
#[response(CancelBuildResponse)]
pub struct CancelBuild {
    pub build_id: String,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CancelBuildResponse {}
